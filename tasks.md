# Chow Marketplace - Code Cleanup Tasks

**Last Updated:** March 3, 2026  
**Status:** Simplified & Actionable  
**Focus:** Clean Architecture & Code Quality

---

## 🎯 Core Objectives

1. **Fix Payment Workflow** - Ensure vendors get paid correctly (CRITICAL)
2. **Centralize Supabase Access** - All database calls through services layer
3. **Remove Duplicate Logic** - DRY principle across codebase
4. **Remove Unused Files** - Clean up dead code
5. **Order Instruction Files** - Organize documentation properly
6. **Enforce Separation of Concerns** - Clear layer boundaries

---

## � TASK 0: Complete System Review (Before Payment Fix)

**Status:** Required before starting payment workflow fix  
**Assigned To:** Agentic Code Review Agent  
**Duration:** 2-3 hours  
**Purpose:** Comprehensive audit of current system state

---

### 📋 System Review Checklist

#### Phase A: Database Schema Audit (30 min)

**Objective:** Verify all tables, columns, and functions exist and match migrations

**A.1: Core Tables Verification**

```sql
-- List all tables in public schema
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Core Tables:**

- profiles
- products
- orders
- order_items
- wallets ⚠️ (new - may not exist)
- wallet_transactions ⚠️ (new - may not exist)
- payments ⚠️ (new - may not exist)
- virtual_accounts ⚠️ (new - may not exist)
- vendor_payouts
- platform_earnings
- reviews
- delivery_addresses
- promo_codes
- search_analytics
- banners

**A.2: Escrow Columns Verification**

```sql
-- Check orders table has all escrow columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

**Required Escrow Columns:**

- escrow_status
- funds_released_at
- eligible_for_release_at
- platform_fee_percentage
- platform_fee_amount
- vendor_payout_amount
- payout_status
- payout_reference
- payout_completed_at
- release_hold_reason

**A.3: Database Functions Verification**

```sql
-- List all custom functions
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Required Functions:**

- credit_wallet
- debit_wallet
- get_wallet_balance
- calculate_escrow_amounts
- set_order_delivered
- release_escrow_to_vendor
- auto_release_eligible_escrow
- update_updated_at_column

**A.4: Indexes Verification**

```sql
-- List all indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('orders', 'wallets', 'wallet_transactions', 'payments', 'virtual_accounts')
ORDER BY tablename, indexname;
```

**Document:** Missing tables, columns, functions, or indexes

---

#### Phase B: Edge Functions & Cron Audit (20 min)

**Objective:** Verify all serverless functions are deployed and configured

**B.1: Edge Functions Deployment**
Navigate to: Supabase Dashboard → Edge Functions

**Check Deployment Status:**

- [ ] paystack-webhook (deployed?)
- [ ] auto-release-escrow (deployed?)
- [ ] paystack-create-dva (deployed?)
- [ ] paystack-verify (deployed?)
- [ ] process-refund (deployed?)

**B.2: Edge Functions Testing**
Test each function manually:

```bash
# Test auto-release-escrow
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/auto-release-escrow' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'

# Check response for errors
```

**B.3: Cron Jobs Verification**

```sql
-- List all cron jobs
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job;
```

**Expected Cron Jobs:**

- auto-release-escrow-hourly (schedule: 0 \* \* \* \*)
- (any other scheduled jobs)

**Document:** Missing functions, deployment errors, missing cron jobs

---

#### Phase C: Frontend-Backend Integration Review (45 min)

**Objective:** Verify frontend code correctly uses backend services

**C.1: Service Layer Audit**
Check `services/` directory:

```powershell
Get-ChildItem -Path mobile-app/services -Recurse -Include *.ts | ForEach-Object {
  Write-Host $_.Name
  Select-String -Path $_ -Pattern "from '@/lib/supabase'" | Select-Object LineNumber, Line
}
```

**Verify Services Exist:**

- [ ] services/orders.ts
- [ ] services/products.ts
- [ ] services/profiles.ts (✅ verified - has getWalletBalance)
- [ ] services/wallet.ts
- [ ] services/virtualAccounts.ts
- [ ] services/payments.ts

**C.2: Hooks Layer Audit**
Check `hooks/` directory for direct supabase imports (should use services):

```powershell
Get-ChildItem -Path mobile-app/hooks -Recurse -Include *.ts |
  Select-String "from '@/lib/supabase'" |
  Select-Object Path, LineNumber -Unique
```

**Expected:** ONLY service imports, NO supabase imports

**C.3: Components Layer Audit**
Check `app/` directory for direct supabase/service imports:

```powershell
# Check for supabase imports (should be ZERO)
Get-ChildItem -Path mobile-app/app -Recurse -Include *.tsx |
  Select-String "from '@/lib/supabase'" |
  Select-Object Path -Unique

# Check for service imports (should be ZERO - use hooks only)
Get-ChildItem -Path mobile-app/app -Recurse -Include *.tsx |
  Select-String "from '@/services/" |
  Select-Object Path -Unique
```

**Expected:** Components should ONLY import hooks, never services or supabase

**C.4: Critical Hooks Review**
Manually review these hooks:

- [ ] hooks/useVendorEarnings.ts (check revenue calculation)
- [ ] hooks/useVendorStats.ts (check data source)
- [ ] hooks/useWallet.ts (✅ verified - uses ProfileService)
- [ ] hooks/useOrders.ts (check for direct queries)

**Document:** Architecture violations, direct imports bypassing layers

---

#### Phase D: Data Consistency Check (30 min)

**Objective:** Verify data integrity and identify orphaned/inconsistent records

**D.1: Orders Data Health**

```sql
-- Check for orders without escrow fields set
SELECT
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE escrow_status IS NULL) as missing_escrow_status,
  COUNT(*) FILTER (WHERE vendor_payout_amount IS NULL) as missing_vendor_payout,
  COUNT(*) FILTER (WHERE platform_fee_amount IS NULL) as missing_platform_fee
FROM orders;

-- Expected: All counts in FILTER should be 0 (or only old orders from before migration)
```

**D.2: Wallet Data Health**

```sql
-- Check vendor wallet balances
SELECT
  p.full_name,
  p.role,
  COALESCE(w.balance, 0) as wallet_balance,
  (SELECT COUNT(*) FROM orders WHERE vendor_id = p.id AND escrow_status = 'released') as released_orders,
  (SELECT SUM(vendor_payout_amount) FROM orders WHERE vendor_id = p.id AND escrow_status = 'released') as expected_balance
FROM profiles p
LEFT JOIN wallets w ON w.user_id = p.id
WHERE p.role = 'vendor'
ORDER BY wallet_balance DESC;

-- Compare wallet_balance with expected_balance
-- Significant mismatch indicates missing releases
```

**D.3: Orphaned Records**

```sql
-- Orders without vendors
SELECT COUNT(*) FROM orders WHERE vendor_id NOT IN (SELECT id FROM profiles);

-- Order items without orders
SELECT COUNT(*) FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);

-- Payments without users
SELECT COUNT(*) FROM payments WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Wallet transactions without wallets
SELECT COUNT(*) FROM wallet_transactions WHERE wallet_id NOT IN (SELECT id FROM wallets);
```

**D.4: Revenue Reconciliation**

```sql
-- Platform earnings vs order fees
WITH order_fees AS (
  SELECT SUM(platform_fee_amount) as total_from_orders
  FROM orders
  WHERE escrow_status = 'released'
),
platform_records AS (
  SELECT SUM(amount) as total_from_platform_earnings
  FROM platform_earnings
)
SELECT
  order_fees.total_from_orders,
  platform_records.total_from_platform_earnings,
  (order_fees.total_from_orders - COALESCE(platform_records.total_from_platform_earnings, 0)) as discrepancy
FROM order_fees, platform_records;

-- Discrepancy should be close to 0
```

**Document:** Inconsistencies, orphaned records, reconciliation issues

---

#### Phase E: Security & RLS Review (20 min)

**Objective:** Verify Row Level Security is properly configured

**E.1: Tables with RLS Enabled**

```sql
-- Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**All tables should have:** `rowsecurity = true`

**E.2: RLS Policies Audit**

```sql
-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Critical Tables to Check:**

- wallets (users can only see their own)
- wallet_transactions (users can only see their own)
- payments (users can only see their own)
- orders (vendors see their orders, customers see theirs)
- virtual_accounts (users can only see their own)

**E.3: Service Role Access**

```sql
-- Check which functions use SECURITY DEFINER
SELECT
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND security_type = 'DEFINER';
```

**Functions requiring SECURITY DEFINER:**

- credit_wallet
- debit_wallet
- release_escrow_to_vendor
- auto_release_eligible_escrow

**Document:** Missing RLS, overly permissive policies, missing SECURITY DEFINER

---

#### Phase F: Performance & Optimization Review (25 min)

**Objective:** Identify slow queries and missing optimizations

**F.1: Slow Queries Analysis**

```sql
-- Check for missing indexes on foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND kcu.table_name IN ('orders', 'order_items', 'wallet_transactions', 'payments')
ORDER BY tc.table_name, kcu.column_name;
```

Compare with existing indexes - all FK columns should have indexes.

**F.2: Table Sizes**

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

**F.3: Expensive Queries**
Review hooks for N+1 queries:

- Check if order details fetch includes related data (items, products)
- Check if vendor stats do multiple round trips
- Check if analytics aggregations are efficient

**Document:** Missing indexes, N+1 queries, large table scans

---

#### Phase G: Code Quality & Architecture Review (30 min)

**Objective:** Identify code smells and architecture violations

**G.1: Unused Files**

```powershell
# Find empty files
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx |
  Where-Object { $_.Length -eq 0 } |
  Select-Object FullName
```

**G.2: Duplicate Code Detection**
Search for duplicate query patterns:

```powershell
# Find files querying orders table
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx |
  Select-String "\.from\('orders'\)" |
  Group-Object Path |
  Select-Object Count, Name |
  Sort-Object Count -Descending
```

Files with high count = potential code duplication

**G.3: Error Handling Audit**
Search for unhandled errors:

```powershell
# Find await without try-catch
Get-ChildItem -Path mobile-app/app -Recurse -Include *.tsx |
  Select-String "await " |
  Select-Object Path -Unique
```

Manually review if errors are handled (try-catch or .catch())

**G.4: Type Safety Audit**
Search for `any` types:

```powershell
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx |
  Select-String ": any" |
  Select-Object Path, LineNumber, Line
```

**Document:** Empty files, duplicate code, missing error handling, type safety issues

---

### 📊 System Review Deliverables

**Create a comprehensive report with:**

1. **Database State**
   - Tables exist: X/Y
   - Functions exist: X/Y
   - Indexes exist: X/Y
   - Sample data counts
   - Missing migrations to deploy

2. **Deployment State**
   - Edge Functions: X/Y deployed
   - Cron jobs: X/Y configured
   - Recent execution logs

3. **Architecture Compliance**
   - Components violating layer rules: X
   - Hooks with direct DB access: X
   - Services properly structured: ✓/✗

4. **Data Integrity**
   - Orphaned records: X
   - Revenue reconciliation: ±₦X discrepancy
   - Wallet balance accuracy: ✓/✗

5. **Security Posture**
   - Tables without RLS: X
   - Overly permissive policies: X
   - Missing SECURITY DEFINER: X

6. **Performance Issues**
   - Missing indexes: X
   - N+1 query patterns: X
   - Large table scans: X

7. **Code Quality**
   - Empty files: X
   - Duplicate code instances: X
   - Missing error handling: X
   - Type safety issues: X

8. **Priority Recommendations**
   - Critical fixes (must do)
   - High priority (should do)
   - Medium priority (nice to have)
   - Low priority (future)

---

## �🚨 PRIORITY 0: Payment Workflow Review & Fix (CRITICAL)

**Status:** ⚠️ VENDORS NOT GETTING PAID  
**Assigned To:** Agentic Code Review Agent  
**Context Documents:**

- [supabase/migrations/20260127_create_escrow_system.sql](c:\Resources\app\chow\supabase\migrations\20260127_create_escrow_system.sql)
- [supabase/migrations/20260303_create_wallet_system.sql](c:\Resources\app\chow\supabase\migrations\20260303_create_wallet_system.sql)
- [supabase/migrations/20260303_create_paystack_integration.sql](c:\Resources\app\chow\supabase\migrations\20260303_create_paystack_integration.sql)
- [MISSING_TABLES_ANALYSIS.md](c:\Resources\app\chow\MISSING_TABLES_ANALYSIS.md)
- [PAYMENT_WORKFLOW_TASKS.md](c:\Resources\app\chow\PAYMENT_WORKFLOW_TASKS.md)
- [VERIFY_PAYMENT_SYSTEM.md](c:\Resources\app\chow\VERIFY_PAYMENT_SYSTEM.md)

---

### 📋 Payment Workflow Definition

**Business Model:** Marketplace with 24-hour escrow system

#### Complete Payment Flow (How It Should Work):

```
1. CUSTOMER CHECKOUT
   Customer browses products → Adds to cart → Checks out
   ↓
   Frontend: app/(tabs)/(orders)/checkout.tsx
   ↓
   Action: Create order with escrow fields
   Database: INSERT INTO orders
   Fields Set:
   - total = ₦10,000 (customer pays)
   - platform_fee_percentage = 5.00
   - platform_fee_amount = ₦500 (calculated: total * 0.05)
   - vendor_payout_amount = ₦9,500 (calculated: total * 0.95)
   - escrow_status = 'held'
   - payout_status = 'on_hold'
   - payment_status = 'pending'
   - status = 'pending'

2. CUSTOMER PAYMENT
   Customer pays ₦10,000 via Paystack (card/transfer/virtual account)
   ↓
   Paystack processes payment → Sends webhook
   ↓
   Edge Function: supabase/functions/paystack-webhook/index.ts
   ↓
   Actions:
   a) Record payment in 'payments' table
   b) Call credit_wallet(customer_id, ₦10,000) - credit customer wallet
   c) Update order: payment_status = 'paid'
   ↓
   Database State:
   - payments table: New record (₦10,000, status='success')
   - wallets table: Customer balance +₦10,000
   - orders table: payment_status = 'paid', escrow_status = 'held'

3. VENDOR ACCEPTS & PROCESSES
   Vendor sees order → Marks as 'confirmed' → Prepares order
   ↓
   Frontend: app/(tabs)/(sell)/order-detail.tsx
   ↓
   Action: Update order status to 'confirmed'
   ↓
   Database State:
   - orders table: status = 'confirmed'
   - products table: stock decremented (via trigger)

4. VENDOR DELIVERS
   Vendor marks order as delivered
   ↓
   Frontend: app/(tabs)/(sell)/order-detail.tsx
   ↓
   Action: Call RPC function set_order_delivered(order_id, 24)
   ↓
   Database Function: set_order_delivered()
   ↓
   Actions:
   a) Update status = 'delivered'
   b) Set eligible_for_release_at = NOW() + 24 hours
   c) Set delivered_at = NOW()
   ↓
   Database State:
   - orders table:
     * status = 'delivered'
     * eligible_for_release_at = '2026-03-04 14:30:00' (24hrs from now)
     * escrow_status = 'held' (still locked)

5. ESCROW HOLD PERIOD (24 HOURS)
   Customer has 24 hours to dispute/report issues
   ↓
   If customer disputes → Admin reviews → Possible refund
   If no disputes → Automatic release after 24 hours

6. AUTOMATIC ESCROW RELEASE
   Cron job runs hourly: 0 * * * *
   ↓
   Edge Function: supabase/functions/auto-release-escrow/index.ts
   ↓
   Action: Call RPC function auto_release_eligible_escrow()
   ↓
   Database Function: auto_release_eligible_escrow()
   ↓
   Logic:
   a) Find all orders WHERE:
      - escrow_status = 'held'
      - eligible_for_release_at <= NOW()
      - payment_status = 'paid'
      - status = 'delivered'
   b) For each eligible order:
      - Call release_escrow_to_vendor(order_id)
   ↓
   Database Function: release_escrow_to_vendor(order_id)
   ↓
   Actions:
   a) Calculate amounts:
      - platform_fee = ₦500 (5% of ₦10,000)
      - vendor_payout = ₦9,500 (95% of ₦10,000)
   b) Call credit_wallet(vendor_id, ₦9,500, 'Earnings from order #XYZ', 'escrow_release_ORDER_ID')
   c) Insert into platform_earnings (₦500)
   d) Update order:
      - escrow_status = 'released'
      - funds_released_at = NOW()
      - payout_status = 'pending' (ready for withdrawal)
   ↓
   Database State:
   - wallets table: Vendor balance +₦9,500
   - wallet_transactions table: New record (credit, ₦9,500, 'escrow_release')
   - platform_earnings table: New record (₦500, type='commission')
   - orders table: escrow_status = 'released', funds_released_at = NOW()

7. VENDOR SEES EARNINGS
   Vendor opens analytics page
   ↓
   Frontend: app/(tabs)/(sell)/analytics.tsx
   ↓
   Hooks:
   - useVendorEarnings(vendor_id) → Fetches order totals
   - useWalletBalance(vendor_id) → Fetches wallet.balance
   ↓
   Display:
   - Total Revenue: ₦9,500 (vendor_payout_amount, NOT order.total)
   - Wallet Balance: ₦9,500 (from wallets table)
   - In Escrow: ₦0 (orders with escrow_status='held')
```

---

### 🎯 Expected Behavior at Each Stage

| Stage               | Database State                                      | Frontend Display                           | Backend Action                      |
| ------------------- | --------------------------------------------------- | ------------------------------------------ | ----------------------------------- |
| **Order Created**   | `escrow_status='held'`, `payout_status='on_hold'`   | Order shows "Pending Payment"              | None                                |
| **Payment Success** | `payment_status='paid'`                             | Order shows "Paid - Awaiting Confirmation" | Webhook credits customer wallet     |
| **Vendor Confirms** | `status='confirmed'`                                | Order shows "Processing"                   | Stock decremented                   |
| **Vendor Delivers** | `status='delivered'`, `eligible_for_release_at` set | Order shows "Delivered"                    | 24hr timer starts                   |
| **After 24hrs**     | `escrow_status='released'`, `funds_released_at` set | Wallet balance increases                   | Vendor wallet credited ₦9,500       |
| **Analytics**       | Wallet balance > 0                                  | Shows correct earnings                     | Revenue uses `vendor_payout_amount` |

---

### 🐛 Known Issues to Investigate

#### Issue 1: Wallet Balance Shows ₦0

**Symptom:** Vendors see ₦0 in wallet despite having delivered orders  
**Possible Causes:**

- ❓ Wallet tables not deployed (tables don't exist in database)
- ❓ Escrow migration not deployed (escrow functions don't exist)
- ❓ Edge Function not deployed (auto-release not running)
- ❌ **CONFIRMED: Cron job NOT configured** (Edge Function not triggered hourly)
- ❓ No orders eligible for release yet (all orders < 24hrs old)
- ❓ Errors in release_escrow_to_vendor() function (silent failures)

#### Issue 2: Revenue Shows Wrong Amount

**Symptom:** Analytics shows ₦29,000 instead of ₦27,550  
**Cause:** ✅ IDENTIFIED - Using `order.total` instead of `vendor_payout_amount`  
**Files to Fix:**

- `hooks/useVendorEarnings.ts` lines 41-42, 53, 69
- Change: `order.total` → `vendor_payout_amount || order.total * 0.95`

#### Issue 3: Escrow Never Releases

**Symptom:** Orders stay in `escrow_status='held'` forever  
**Confirmed Causes:**

- ❌ **Cron job NOT configured** - No automatic triggering
  **Possible Additional Causes:**
- ❓ Edge Function not deployed
- ❓ Function errors not logged
- ❓ RPC function permission issues

---

### 🔍 Agent Instructions: Payment Workflow Review

**Your Mission:** Verify and fix the payment workflow so vendors get paid correctly.

#### Phase 1: Database Verification (30 min)

**Objective:** Confirm all required tables, columns, and functions exist

**Step 1.1: Check Tables Exist**
Run this in Supabase SQL Editor:

```sql
-- Should return 6 rows
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'orders',
  'wallets',
  'wallet_transactions',
  'payments',
  'virtual_accounts',
  'platform_earnings'
);
```

**Expected:** 6 tables exist  
**If not:** Deploy missing migrations in order:

1. `20260303_create_wallet_system.sql`
2. `20260303_create_paystack_integration.sql`
3. `20260127_create_escrow_system.sql`

**Step 1.2: Check Escrow Columns Exist**

```sql
-- Should return 10 rows
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
  'escrow_status',
  'funds_released_at',
  'eligible_for_release_at',
  'platform_fee_percentage',
  'platform_fee_amount',
  'vendor_payout_amount',
  'payout_status',
  'payout_reference',
  'payout_completed_at',
  'release_hold_reason'
);
```

**Expected:** 10 columns exist  
**If not:** Deploy `20260127_create_escrow_system.sql`

**Step 1.3: Check Functions Exist**

```sql
-- Should return 7 rows
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'credit_wallet',
  'debit_wallet',
  'get_wallet_balance',
  'calculate_escrow_amounts',
  'set_order_delivered',
  'release_escrow_to_vendor',
  'auto_release_eligible_escrow'
);
```

**Expected:** 7 functions exist  
**If not:** Deploy escrow and wallet migrations

**Step 1.4: Check Current Data State**

```sql
-- Check vendor wallets
SELECT
  p.full_name,
  p.email,
  w.balance,
  w.last_credited_at
FROM wallets w
JOIN profiles p ON w.user_id = p.id
WHERE p.role = 'vendor'
ORDER BY w.balance DESC;

-- Check orders in escrow
SELECT
  id,
  vendor_id,
  total,
  vendor_payout_amount,
  escrow_status,
  payout_status,
  eligible_for_release_at,
  status
FROM orders
WHERE escrow_status = 'held'
ORDER BY created_at DESC
LIMIT 10;

-- Check recently released orders
SELECT
  id,
  vendor_id,
  vendor_payout_amount,
  escrow_status,
  funds_released_at
FROM orders
WHERE escrow_status = 'released'
ORDER BY funds_released_at DESC
LIMIT 10;
```

**Document findings:** Create summary of current state

---

#### Phase 2: Edge Function Verification (20 min)

**Objective:** Confirm auto-release Edge Function is deployed and configure cron job

**Step 2.1: Check Edge Function Deployment**
Navigate to: Supabase Dashboard → Edge Functions → auto-release-escrow

**Expected:** Function shows as deployed  
**If not:** Deploy with:

```bash
cd c:\Resources\app\chow
supabase functions deploy auto-release-escrow
```

**Step 2.2: Configure Cron Schedule (REQUIRED)**

**⚠️ CRITICAL: Cron job NOT yet configured - must be created**

**Method 1: Via Supabase Dashboard (Recommended)**

1. Navigate to: Supabase Dashboard → Database → Extensions
2. Enable `pg_cron` extension if not enabled
3. Go to: SQL Editor
4. Run this SQL:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to run every hour at minute 0
SELECT cron.schedule(
  'auto-release-escrow-hourly',           -- Job name
  '0 * * * *',                            -- Cron schedule (every hour)
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_PROJECT_URL/functions/v1/auto-release-escrow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify cron job was created
SELECT * FROM cron.job WHERE jobname = 'auto-release-escrow-hourly';
```

**⚠️ IMPORTANT:** Replace:

- `YOUR_SUPABASE_PROJECT_URL` with your actual Supabase URL (e.g., `https://abc123.supabase.co`)
- `YOUR_ANON_KEY` with your Supabase anon/public key

**Method 2: Via Supabase pg_net (Alternative)**

```sql
-- Schedule the escrow release to run every hour
SELECT cron.schedule(
  'hourly-escrow-release',
  '0 * * * *',
  $$
  SELECT http((
    'POST',
    format('%s/functions/v1/auto-release-escrow', current_setting('app.settings.supabase_url')),
    ARRAY[http_header('Authorization', format('Bearer %s', current_setting('app.settings.service_role_key')))],
    'application/json',
    '{}'
  )::http_request);
  $$
);
```

**Method 3: Manual Testing (Temporary)**
For immediate testing without cron:

```sql
-- Manually trigger the Edge Function via SQL
SELECT net.http_post(
  url := 'YOUR_SUPABASE_PROJECT_URL/functions/v1/auto-release-escrow',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
  )
);
```

**Step 2.3: Verify Cron Job Created**

```sql
-- List all cron jobs
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobid DESC;
```

**Expected Output:**

- Job with schedule `0 * * * *`
- Job name like `auto-release-escrow-hourly` or `hourly-escrow-release`
- `active = true`

**Step 2.4: Review Function Logs (After Setup)**
Wait 1 hour, then check Edge Function logs for:

- First execution timestamp
- Released order count
- Any error messages

**Manual Test (Don't wait for cron):**
Trigger Edge Function manually to test:

```bash
# Via curl
curl -X POST \
  'YOUR_SUPABASE_URL/functions/v1/auto-release-escrow' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# Or via Supabase Dashboard → Edge Functions → auto-release-escrow → Invoke
```

**Step 2.5: Manual SQL Release Test**

```sql
-- Find a delivered order > 24hrs old
SELECT id, eligible_for_release_at
FROM orders
WHERE status = 'delivered'
AND escrow_status = 'held'
AND eligible_for_release_at <= NOW()
LIMIT 1;

-- Manually trigger release
SELECT release_escrow_to_vendor('ORDER_ID_HERE');

-- Verify wallet was credited
SELECT * FROM wallet_transactions
WHERE reference LIKE 'escrow_release_%'
ORDER BY created_at DESC LIMIT 1;
```

**Document findings:** Does manual release work?

---

#### Phase 3: Frontend Code Review (30 min)

**Objective:** Verify frontend correctly uses escrow system

**Step 3.1: Check Checkout Flow**
File: `app/(tabs)/(orders)/checkout.tsx`

**Verify:**

- ✅ Sets `platform_fee_amount` = `total * 0.05`
- ✅ Sets `vendor_payout_amount` = `total * 0.95`
- ✅ Sets `escrow_status` = `'held'`
- ✅ Sets `payout_status` = `'on_hold'`

**Step 3.2: Check Order Delivery Flow**
File: `app/(tabs)/(sell)/order-detail.tsx`

**Verify:**

- ✅ Calls `set_order_delivered(order_id, 24)` when marking delivered
- ✅ Shows 24-hour release timer
- ✅ Displays escrow status correctly

**Step 3.3: Check Analytics Display**
File: `app/(tabs)/(sell)/analytics.tsx`

**Verify:**

- ✅ Uses `useWalletBalance()` hook (not inline query)
- ✅ Displays wallet balance from `wallets` table
- ✅ In Escrow calculated from orders with `escrow_status='held'`

**Step 3.4: Check Revenue Calculations**
File: `hooks/useVendorEarnings.ts`

**🔴 CRITICAL FIX NEEDED:**

```typescript
// Lines 41-42, 53, 69
// ❌ WRONG: Uses customer payment amount
const totalRevenue = deliveredOrders.reduce(
  (sum, o) => sum + Number(o.total),
  0,
);

// ✅ CORRECT: Uses vendor earnings amount
const totalRevenue = deliveredOrders.reduce(
  (sum, o) => sum + Number(o.vendor_payout_amount || o.total * 0.95),
  0,
);
```

**Action Required:** Fix all 3 occurrences in `useVendorEarnings.ts`

---

#### Phase 4: Integration Testing (30 min)

**Objective:** Create end-to-end test order and verify full flow

**Step 4.1: Create Test Order**

1. As customer, create order for ₦10,000
2. Verify database:
   ```sql
   SELECT
     total,
     platform_fee_amount,
     vendor_payout_amount,
     escrow_status,
     payout_status
   FROM orders
   WHERE id = 'TEST_ORDER_ID';
   ```
3. Expected:
   - `total = 10000.00`
   - `platform_fee_amount = 500.00`
   - `vendor_payout_amount = 9500.00`
   - `escrow_status = 'held'`
   - `payout_status = 'on_hold'`

**Step 4.2: Simulate Payment**

```sql
-- Manually update payment status (or use Paystack test mode)
UPDATE orders
SET payment_status = 'paid'
WHERE id = 'TEST_ORDER_ID';
```

**Step 4.3: Mark as Delivered**

1. As vendor, mark order delivered in app
2. Verify database:
   ```sql
   SELECT
     status,
     eligible_for_release_at,Job (10 min) - REQUIRED**
   ```

⚠️ **CRITICAL: This is NOT deployed yet - must be set up**

Run this in Supabase SQL Editor:

```sql
-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create hourly cron job
SELECT cron.schedule(
  'auto-release-escrow-hourly',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-release-escrow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    bo**Cron job CREATED and verified** (run `SELECT * FROM cron.job`)
- [ ] Revenue calculations fixed
- [ ] Test order flows end-to-end
- [ ] Vendor sees correct wallet balance
- [ ] Analytics shows vendor earnings (not customer payment)
- [ ] Platform earnings recorded
- [ ] **Cron executes successfully** (check after 1 hour or manual trigger)
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'auto-release-escrow-hourly';
```

**Replace these values:**

- `YOUR_PROJECT_REF` → Your Supabase project reference (from project URL)
- `YOUR_ANON_KEY` → Your public/anon key (safe to use for Edge Functions)

**To get your values:**

1. Supabase Dashboard → Settings → API
2. Copy "Project URL" (contains project ref)
3. Copy "anon public" key

**Alternative: Manual trigger for testing (until cron is set up):**

```bash
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/auto-release-escrow' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
``
```

3. Expected:
   - `status = 'delivered'`
   - `eligible_for_release_at = NOW() + 24 hours`
   - `escrow_status = 'held'`

**Step 4.4: Force Immediate Release (Testing Only)**

```sql
-- Bypass 24hr wait for testing
UPDATE orders
SET eligible_for_release_at = NOW() - INTERVAL '1 hour'
WHERE id = 'TEST_ORDER_ID';

-- Manually trigger release
SELECT release_escrow_to_vendor('TEST_ORDER_ID');
```

**Step 4.5: Verify Release Success**

```sql
-- Check order updated
SELECT
  escrow_status,
  funds_released_at,
  payout_status
FROM orders
WHERE id = 'TEST_ORDER_ID';
-- Expected: escrow_status='released', funds_released_at=NOW(), payout_status='pending'

-- Check wallet credited
SELECT balance
FROM wallets
WHERE user_id = 'VENDOR_USER_ID';
-- Expected: balance increased by 9500.00

-- Check transaction logged
SELECT *
FROM wallet_transactions
WHERE reference = 'escrow_release_TEST_ORDER_ID';
-- Expected: 1 row, type='credit', amount=9500.00

-- Check platform earnings recorded
SELECT *
FROM platform_earnings
WHERE order_id = 'TEST_ORDER_ID';
-- Expected: 1 row, amount=500.00, type='commission'
```

**Step 4.6: Verify Frontend Display**

1. Login as vendor
2. Check analytics page
3. Expected:
   - Total Revenue: ₦9,500 (NOT ₦10,000)
   - Wallet Balance: ₦9,500
   - In Escrow: ₦0

---

#### Phase 5: Implementation & Fixes (Variable Time)

**Fix Priority 1: Revenue Calculations (15 min)**
File: `hooks/useVendorEarnings.ts`

Update 3 locations:

1. Line 41-42: `totalRevenue` calculation
2. Line 53: `monthlyRevenue` calculation
3. Line 69: `previousMonthRevenue` calculation

Change all from:

```typescript
.reduce((sum, o) => sum + Number(o.total), 0)
```

To:

```typescript
.reduce((sum, o) => sum + Number(o.vendor_payout_amount || o.total * 0.95), 0)
```

**Fix Priority 2: Deploy Missing Migrations (30 min)**
If database verification failed, deploy in order:

1. Run `20260303_create_wallet_system.sql`
2. Run `20260303_create_paystack_integration.sql`
3. Run `20260127_create_escrow_system.sql`

**Fix Priority 3: Deploy Edge Function (10 min)**

```bash
cd c:\Resources\app\chow
supabase functions deploy auto-release-escrow
```

**Fix Priority 4: Configure Cron (5 min)**
Supabase Dashboard → Database → Cron Jobs → Create:

- Schedule: `0 * * * *`
- Function: `auto-release-escrow`

**Fix Priority 5: Any Code Issues Found**
Based on code review findings, fix:

- Missing escrow field calculations
- Incorrect function calls
- UI display issues

---

**CONFIRMED: Cron job NOT configured - needs to be created**

#### Phase 6: Final Verification (20 min)

**Checklist:**

- [ ] All 6 tables exist
- [ ] All 10 escrow columns exist in orders
- [ ] All 7 functions exist
- [ ] Edge Function deployed
- [ ] Cron job configured (0 \* \* \* \*)
- [ ] Revenue calculations fixed
- [ ] Test order flows end-to-end
- [ ] Vendor sees correct wallet balance
- [ ] Analytics shows vendor earnings (not customer payment)
- [ ] Platform earnings recorded

**Success Criteria:**

```sql
-- Run this final verification
WITH test_metrics AS (
  SELECT
    COUNT(*) FILTER (WHERE escrow_status = 'held') as held_count,
    COUNT(*) FILTER (WHERE escrow_status = 'released') as released_count,
    SUM(vendor_payout_amount) FILTER (WHERE escrow_status = 'released') as total_released
  FROM orders
)
SELECT
  t.*,
  (SELECT SUM(balance) FROM wallets WHERE user_id IN (
    SELECT id FROM profiles WHERE role = 'vendor'
  )) as total_vendor_balance,
  (SELECT SUM(amount) FROM platform_earnings) as total_platform_earnings
FROM test_metrics t;
```

**Expected Results:**

- ✅ `total_vendor_balance` > 0 (vendors have money)
- ✅ `total_released` = sum of `vendor_payout_amount` for released orders
- ✅ `total_platform_earnings` = sum of all 5% commission fees
- ✅ Math checks out: `total_released + total_platform_earnings` ≈ total customer payments

---

### 📊 Deliverables

**Report to provide:**

1. **Database State Summary**
   - Tables exist: YES/NO
   - Functions exist: YES/NO
   - Sample data: row counts, balances

2. **Deployment Status**
   - Edge Function deployed: YES/NO
   - Cron configured: YES/NO
   - Recent execution logs: paste snippet

3. **Code Issues Found**
   - List of files with problems
   - Description of each issue
   - Severity (Critical/High/Medium/Low)

4. **Fixes Implemented**
   - List of files changed
   - Description of changes
   - Before/after code snippets

5. **Test Results**
   - End-to-end test: PASS/FAIL
   - Manual release test: PASS/FAIL
   - Analytics display: PASS/FAIL
   - Final verification query results

6. **Recommendations**
   - Monitoring to add
   - Error handling to improve
   - Future enhancements

---

### 🎯 Success Definition

**Payment workflow is FIXED when:**

1. ✅ New order → Checkout → Payment → Delivery → 24hrs → Vendor wallet shows +₦9,500
2. ✅ Analytics displays correct revenue (vendor earnings, not customer payment)
3. ✅ Platform earns 5% commission (₦500 per ₦10,000 order)
4. ✅ Escrow auto-releases hourly without manual intervention
5. ✅ Wallet balances reconcile with wallet_transactions
6. ✅ No errors in Edge Function logs

---

### 🤖 Agent Prompt (Copy & Paste This)

```
I need you to perform a comprehensive review and fix of the payment workflow in the Chow marketplace application. This is CRITICAL - vendors are currently not getting paid despite having delivered orders.

CONTEXT:
- This is a React Native app with Expo Router + Supabase backend
- Business model: Marketplace with 24-hour escrow (platform takes 5% commission)
- Problem: Vendor wallet balances show ₦0 despite having completed orders
- Architecture: PostgreSQL database with Edge Functions (Deno) for automation

YOUR MISSION:
Follow the detailed instructions in tasks.md under "PRIORITY 0: Payment Workflow Review & Fix"

APPROACH:
1. Database Verification (30 min) - Check all tables, columns, functions exist
2. Edge Function Verification (20 min) - Verify auto-release is deployed and running
3. Frontend Code Review (30 min) - Check checkout, delivery, analytics code
4. Integration Testing (30 min) - Create test order and verify full payment flow
5. Implementation & Fixes (Variable) - Fix all identified issues
6. Final Verification (20 min) - Run verification queries and confirm success

KEY FILES TO REVIEW:
- supabase/migrations/20260127_create_escrow_system.sql
- supabase/migrations/20260303_create_wallet_system.sql
- supabase/migrations/20260303_create_paystack_integration.sql
- supabase/functions/auto-release-escrow/index.ts
- hooks/useVendorEarnings.ts (CRITICAL FIX NEEDED - line 41-42, 53, 69)
- app/(tabs)/(sell)/analytics.tsx
- app/(tabs)/(orders)/checkout.tsx
- app/(tabs)/(sell)/order-detail.tsx

EXPECTED PAYMENT FLOW:
1. Customer pays ₦10,000 → Order created with escrow_status='held'
2. Vendor delivers → eligible_for_release_at set to NOW() + 24hrs
3. After 24hrs → Cron triggers auto-release
4. Vendor wallet credited ₦9,500 (95%)
5. Platform earns ₦500 (5%)
6. Analytics shows correct vendor earnings

CRITICAL FIXES IDENTIFIED:
1. Revenue calculations using order.total instead of vendor_payout_amount
2. Possible missing database migrations (tables may not exist)
3. Possible missing Edge Function deployment
4. Possible missing cron job configuration

DELIVERABLES NEEDED:
1. Database state summary (tables/functions exist?)
2. Deployment status (Edge Function running? Cron configured?)
3. Code issues found (list with severity)
4. Fixes implemented (file changes with before/after)
5. Test results (end-to-end test pass/fail)
6. Recommendations (monitoring, improvements)

SUCCESS CRITERIA:
- Vendor wallet shows actual earnings (not ₦0)
- Analytics displays vendor payout amounts (not customer payment totals)
- Escrow releases automatically every hour
- Test order flows end-to-end successfully
- All verification queries pass

Read tasks.md PRIORITY 0 section for complete detailed instructions. Work systematically through each phase and document all findings.
```

---

## Task 1: Centralize Supabase Access (Priority 1)

## 📋 Current State

**Problem:**

- 59+ files import `supabase` directly
- Duplicate query logic across hooks
- Unused/empty files scattered
- No clear architecture pattern

**Goal:**

```
Component → Hook → Service → Supabase
```

**Only services/** should touch Supabase directly.

---

## Task 1: Centralize Supabase Access (Priority 1)

**Goal:** All database access through services layer

### Step 1.1: Find All Supabase Imports

```powershell
# Find all files importing supabase
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Select-String "from '@/lib/supabase'" | Select-Object Path -Unique
```

### Step 1.2: Move Hooks to Use Services

**Pattern:**

```typescript
// ❌ BEFORE: Hook directly queries DB
import { supabase } from '@/lib/supabase';

export function useVendorOrders(vendorId: string) {
  return useQuery({
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*')...
      return data;
    }
  });
}

// ✅ AFTER: Hook uses service
import { OrderService } from '@/services/orders';

export function useVendorOrders(vendorId: string) {
  return useQuery({
    queryFn: () => OrderService.getVendorOrders(vendorId)
  });
}
```

### Step 1.3: Move Components to Use Hooks

**Pattern:**

```typescript
// ❌ BEFORE: Component queries DB
import { supabase } from '@/lib/supabase';

function OrderList() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    supabase.from('orders').select('*').then(...)
  }, []);
}

// ✅ AFTER: Component uses hook
import { useVendorOrders } from '@/hooks/useOrders';

function OrderList() {
  const { data: orders, isLoading } = useVendorOrders(vendorId);
}
```

### Step 1.4: Checklist

**Hooks to migrate:**

- [ ] hooks/useVendorEarnings.ts → Use OrderService
- [ ] hooks/useVendorStats.ts → Use OrderService
- [ ] hooks/useOrders.ts → Use OrderService
- [ ] hooks/useProducts.ts → Use ProductService
- [ ] hooks/useVendorRating.ts → Use ReviewService

**Components to migrate:**

- [ ] app/(tabs)/(sell)/analytics.tsx → Remove supabase import
- [ ] app/(tabs)/(sell)/order-detail.tsx → Use hooks only
- [ ] app/(tabs)/(sell)/stock.tsx → Use hooks only
- [ ] app/(tabs)/(profile)/profile.tsx → Use hooks only

**Stores to migrate:**

- [ ] stores/addressStore.ts → Remove supabase, use hooks
- [ ] stores/useProductStore.ts → Keep UI state only

**Expected Result:**

- ✅ Only `services/**` and `lib/supabase.ts` import supabase
- ✅ Hooks use services
- ✅ Components use hooks
- ✅ Stores manage UI state only

---

## Task 2: Remove Duplicate Logic (Priority 2)

**Goal:** Consolidate repeated query patterns

### Step 2.1: Find Duplicate Order Queries

Search for:

```powershell
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Select-String ".from\('orders'\)"
```

### Step 2.2: Consolidate into Service Methods

**Common duplicates:**

1. **Vendor orders query** (appears 3+ times)
   - Solution: `OrderService.getVendorOrders(vendorId)`

2. **Customer orders query** (appears 2+ times)
   - Solution: `OrderService.getCustomerOrders(userId)`

3. **Order by ID** (appears 5+ times)
   - Solution: `OrderService.getById(orderId)`

4. **Product search** (appears 3+ times)
   - Solution: `ProductService.search(query)`

### Step 2.3: Update Services

Ensure `services/orders.ts` has:

```typescript
export const OrderService = {
  async getVendorOrders(vendorId: string) {
    /* ... */
  },
  async getCustomerOrders(userId: string) {
    /* ... */
  },
  async getById(orderId: string) {
    /* ... */
  },
  async updateStatus(orderId: string, status: string) {
    /* ... */
  },
  async create(params: CreateOrderParams) {
    /* ... */
  },
};
```

Ensure `services/products.ts` has:

```typescript
export const ProductService = {
  async getAll() {
    /* ... */
  },
  async getById(id: string) {
    /* ... */
  },
  async search(query: string) {
    /* ... */
  },
  async getByVendor(vendorId: string) {
    /* ... */
  },
  async getLowStock(vendorId: string) {
    /* ... */
  },
};
```

### Step 2.4: Replace All Usages

Find and replace duplicate queries with service calls.

**Expected Result:**

- ✅ Each query pattern exists once in services
- ✅ All hooks use standardized service methods
- ✅ No duplicate `.from('table')` calls

---

## Task 3: Remove Unused Files (Priority 3)

**Goal:** Delete dead code and empty files

### Step 3.1: Find Empty Files

```powershell
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Where-Object { $_.Length -eq 0 }
```

### Step 3.2: Find Unused Imports

For each file, check if it's imported anywhere:

```powershell
# Example: Check if file is used
$file = "services/api/supabase.ts"
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Select-String "from '@/services/api/supabase'"
# If 0 results = unused
```

### Step 3.3: Check for Duplicate Folders

Look for duplicate structure:

- `mobile-app/frontend/` vs `mobile-app/`
- `mobile-app/lib/` vs `mobile-app/utils/`

### Step 3.4: Safe Removal List

**Files to remove:**

- [ ] Empty files found in step 3.1
- [ ] `services/api/supabase.ts` (if unused)
- [ ] Duplicate helper files
- [ ] Old commented-out code files

**Directories to remove:**

- [ ] `frontend/` (if duplicate of root)
- [ ] Empty test directories

**Expected Result:**

- ✅ No empty files
- ✅ No unused imports
- ✅ Cleaner file tree
- ✅ Faster builds

---

## Task 4: Order Instruction Files (Priority 4)

**Goal:** Organize documentation properly

### Step 4.1: Current Documentation Files

```
c:\Resources\app\chow\
├── tasks.md (this file)
├── ARCHITECTURE.md
├── ESCROW_SYSTEM.md
├── README.md
└── mobile-app/
    ├── app.json
    └── package.json
```

### Step 4.2: Create Docs Folder

```powershell
New-Item -Path "c:\Resources\app\chow\docs" -ItemType Directory
```

### Step 4.3: Move Documentation

```powershell
# Move instruction files to docs/
Move-Item "ESCROW_SYSTEM.md" "docs/ESCROW_SYSTEM.md"
Move-Item "ARCHITECTURE.md" "docs/ARCHITECTURE.md"

# Create new organized structure:
# docs/
#   ├── ARCHITECTURE.md (system design)
#   ├── ESCROW_SYSTEM.md (payment flow)
#   ├── API_SERVICES.md (service layer guide - create this)
#   └── SETUP.md (getting started - create this)
```

### Step 4.4: Update README

Create root README.md pointing to docs:

```markdown
# Chow Marketplace

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Setup Guide](docs/SETUP.md)
- [Service Layer Guide](docs/API_SERVICES.md)
- [Escrow System](docs/ESCROW_SYSTEM.md)

## Quick Start

See [docs/SETUP.md](docs/SETUP.md)
```

**Expected Result:**

- ✅ All docs in `docs/` folder
- ✅ Clear README navigation
- ✅ Logical file organization

---

## Task 5: Enforce Separation of Concerns (Priority 5)

**Goal:** Clear boundaries between layers

### Step 5.1: Define Layer Rules

**Components (app/):**

- ✅ Use hooks only
- ❌ Never import supabase
- ❌ Never import services directly

**Hooks (hooks/):**

- ✅ Use services only
- ❌ Never import supabase
- ✅ Can call multiple services

**Services (services/):**

- ✅ Import supabase
- ✅ Handle business logic
- ❌ Never import hooks

**Stores (stores/):**

- ✅ UI state only
- ❌ Never import supabase
- ❌ No data fetching

### Step 5.2: Create Architecture Doc

Create **`docs/API_SERVICES.md`**:

```markdown
# Service Layer Guide

## Architecture Layers
```

Component → Hook → Service → Supabase
↕
Store (UI state)

````

## Rules

1. **Components** use hooks (never services)
2. **Hooks** use services (never supabase)
3. **Services** use supabase
4. **Stores** manage UI state only

## Examples

### ✅ Correct Pattern

```typescript
// Component
function OrderList() {
  const { data: orders } = useVendorOrders(vendorId);
  return <List data={orders} />;
}

// Hook
export function useVendorOrders(vendorId: string) {
  return useQuery({
    queryFn: () => OrderService.getVendorOrders(vendorId)
  });
}

// Service
export const OrderService = {
  async getVendorOrders(vendorId: string) {
    const { data } = await supabase.from('orders')...
    return data;
  }
};
````

### ❌ Wrong Patterns

```typescript
// WRONG: Component calling service directly
function OrderList() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    OrderService.getVendorOrders(vendorId).then(setOrders);
  }, []);
}

// WRONG: Hook querying database
export function useVendorOrders(vendorId: string) {
  return useQuery({
    queryFn: async () => {
      const { data } = await supabase.from('orders')...
      return data;
    }
  });
}

// WRONG: Store fetching data
export const useOrderStore = create((set) => ({
  orders: [],
  fetchOrders: async () => {
    const { data } = await supabase.from('orders')...
    set({ orders: data });
  }
}));
```

````

### Step 5.3: Add Verification Script

Create **`scripts/verify-architecture.ps1`**:

```powershell
# Verify no supabase imports outside services/
$violations = @()

# Check components
$componentFiles = Get-ChildItem -Path mobile-app/app -Recurse -Include *.tsx
$componentViolations = $componentFiles | Select-String "from '@/lib/supabase'"
if ($componentViolations) {
    $violations += "Components importing supabase: $($componentViolations.Count)"
}

# Check hooks
$hookFiles = Get-ChildItem -Path mobile-app/hooks -Recurse -Include *.ts
$hookViolations = $hookFiles | Select-String "from '@/lib/supabase'"
if ($hookViolations) {
    $violations += "Hooks importing supabase: $($hookViolations.Count)"
}

# Check stores
$storeFiles = Get-ChildItem -Path mobile-app/stores -Recurse -Include *.ts
$storeViolations = $storeFiles | Select-String "from '@/lib/supabase'"
if ($storeViolations) {
    $violations += "Stores importing supabase: $($storeViolations.Count)"
}

if ($violations.Count -eq 0) {
    Write-Host "✅ Architecture verified - no violations found" -ForegroundColor Green
} else {
    Write-Host "❌ Architecture violations found:" -ForegroundColor Red
    $violations | ForEach-Object { Write-Host "  - $_" }
    exit 1
}
````

**Expected Result:**

- ✅ Clear layer boundaries
- ✅ Documentation for patterns
- ✅ Automated verification
- ✅ Easy to enforce in code review

---

## ✅ Progress Tracker

### Priority 0: Payment Workflow (CRITICAL)

- [ ] Database verification complete
- [ ] Edge Function verification complete
- [ ] Frontend code review complete
- [ ] Integration testing complete
- [ ] Revenue calculation fix implemented
- [ ] Missing migrations deployed
- [ ] Final verification passed

### Priority 1: Centralize Supabase

- [ ] Find all supabase imports
- [ ] Migrate hooks to services
- [ ] Migrate components to hooks
- [ ] Migrate stores to hooks

### Priority 2: Remove Duplicates

- [ ] Find duplicate order queries
- [ ] Consolidate into service methods
- [ ] Replace all usages

### Priority 3: Remove Unused

- [ ] Find empty files
- [ ] Find unused imports
- [ ] Safe removal

### Priority 4: Order Files

- [ ] Create docs/ folder
- [ ] Move documentation
- [ ] Update README

### Priority 5: Enforce Separation

- [ ] Define layer rules
- [ ] Create architecture doc
- [ ] Add verification script

---

## 🎯 Success Criteria

When all tasks complete:

- ✅ **PAYMENT WORKFLOW FUNCTIONAL** - Vendors getting paid correctly
- ✅ Wallet balances > ₦0 for vendors with delivered orders
- ✅ Revenue calculations show vendor earnings (not customer payments)
- ✅ Escrow auto-releases hourly via cron job
- ✅ Only `services/` imports supabase
- ✅ No duplicate query logic
- ✅ No empty/unused files
- ✅ Documentation organized in `docs/`
- ✅ Clear separation of concerns
- ✅ Verification script passes

---

## 📝 Quick Commands

```powershell
# Find supabase imports
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Select-String "from '@/lib/supabase'"

# Find duplicate queries
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Select-String ".from\('orders'\)"

# Find empty files
Get-ChildItem -Path mobile-app -Recurse -Include *.ts,*.tsx | Where-Object { $_.Length -eq 0 }

# Verify architecture
.\scripts\verify-architecture.ps1
```
