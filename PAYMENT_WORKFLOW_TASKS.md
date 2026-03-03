# Payment Workflow - Implementation Tasks

**Created:** March 3, 2026  
**Priority:** CRITICAL  
**Goal:** Get full payment flow working from customer checkout to vendor wallet credit

---

## 🎯 Overview

Fix the payment workflow so money flows correctly:

```
Customer Pays → Paystack → Escrow Held → Order Delivered → 24hr Wait → Auto-Release → Vendor Wallet
```

**Current Issues:**

- ❌ Vendor wallet balance shows ₦0 (escrow not releasing)
- ❌ Revenue metrics show customer payment total instead of vendor earnings (95%)
- ❌ Auto-release Edge Function not deployed
- ❌ Cron schedule not configured

---

## 📋 Task List

### Task 1: Fix Revenue Calculations ⚡ HIGH PRIORITY

**Problem:** Analytics show `order.total` (customer payment) instead of `vendor_payout_amount` (vendor earnings)

**Impact:**

- Total Revenue shows ₦29,000 instead of ₦27,550 (missing 5% platform fee)
- Misleading vendor earnings data

**Files to Update:**

1. **`mobile-app/hooks/useVendorEarnings.ts`**
   - Line 41-42: Total revenue calculation
   - Line 53: Monthly revenue calculation
   - Line 69: Previous month revenue calculation

2. **`mobile-app/hooks/useVendorStats.ts`**
   - Already removed top customers (✅ done)
   - No changes needed

**Changes Required:**

```typescript
// BEFORE (WRONG)
const totalRevenue = deliveredOrders.reduce(
  (sum, o) => sum + Number(o.total),
  0,
);

// AFTER (CORRECT)
const totalRevenue = deliveredOrders.reduce(
  (sum, o) => sum + Number(o.vendor_payout_amount || o.total * 0.95),
  0,
);
```

**Apply to:**

- Total revenue calculation
- Monthly revenue calculation
- Previous month revenue calculation

**Verification:**

```typescript
// Test calculation:
// If customer paid: ₦10,000
// Platform fee (5%): ₦500
// Vendor should see: ₦9,500

// Check analytics displays correct amounts
```

---

### Task 2: Deploy Escrow Migration ⚡ HIGH PRIORITY

**Problem:** Database lacks escrow functions and tables

**Migration File:** `c:\Resources\app\chow\supabase\migrations\20260127_create_escrow_system.sql`

**Contains:**

- 10 ALTER TABLE statements for orders (escrow fields)
- 11 ALTER TABLE statements for profiles (bank account fields)
- CREATE TABLE vendor_payouts
- CREATE TABLE platform_earnings
- 4 RPC Functions:
  - `calculate_escrow_amounts()`
  - `release_escrow_to_vendor()`
  - `set_order_delivered()`
  - `auto_release_eligible_escrow()`
- Indexes for performance
- RLS policies

**Steps:**

1. **Copy Migration SQL**

   ```powershell
   Get-Content "c:\Resources\app\chow\supabase\migrations\20260127_create_escrow_system.sql"
   ```

2. **Run in Supabase SQL Editor**
   - Go to Supabase Dashboard
   - SQL Editor → New Query
   - Paste full migration
   - Click "Run"

3. **Verify Success**

   ```sql
   -- Check tables exist
   SELECT * FROM vendor_payouts LIMIT 1;
   SELECT * FROM platform_earnings LIMIT 1;

   -- Check functions exist
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_name LIKE '%escrow%';
   ```

**Expected Output:**

- ✅ Tables created: vendor_payouts, platform_earnings
- ✅ 4 functions: calculate_escrow_amounts, release_escrow_to_vendor, set_order_delivered, auto_release_eligible_escrow
- ✅ Indexes created: 6 performance indexes
- ✅ Existing orders updated with initial escrow values

---

### Task 3: Deploy Auto-Release Edge Function ⚡ HIGH PRIORITY

**Problem:** Escrow never auto-releases because Edge Function not deployed

**Function File:** `c:\Resources\app\chow\supabase\functions\auto-release-escrow\index.ts`

**What It Does:**

- Runs every hour via cron
- Calls `auto_release_eligible_escrow()` RPC
- Processes up to 100 orders per run
- Returns `{released_count, failed_count}`

**Steps:**

1. **Verify Supabase CLI Installed**

   ```powershell
   supabase --version
   # If not installed: npm install -g supabase
   ```

2. **Login to Supabase**

   ```powershell
   cd c:\Resources\app\chow
   supabase login
   ```

3. **Link to Project**

   ```powershell
   supabase link --project-ref <your-project-ref>
   # Get project ref from Supabase Dashboard URL
   ```

4. **Deploy Function**

   ```powershell
   supabase functions deploy auto-release-escrow
   ```

5. **Verify Deployment**
   - Go to Supabase Dashboard → Edge Functions
   - Should see `auto-release-escrow` listed
   - Check logs for any errors

**Expected Output:**

```
Deploying function auto-release-escrow...
Function deployed successfully!
URL: https://<project-ref>.supabase.co/functions/v1/auto-release-escrow
```

---

### Task 4: Configure Cron Schedule ⚡ HIGH PRIORITY

**Problem:** Auto-release won't run automatically without cron

**Goal:** Run `auto-release-escrow` every hour at minute :00

**Steps:**

1. **Go to Supabase Dashboard**
   - Navigate to Edge Functions
   - Click `auto-release-escrow`

2. **Add Cron Trigger**
   - Find "Cron" or "Scheduled" section
   - Add schedule: `0 * * * *`
   - Save

3. **Alternative: Use pg_cron (if available)**
   ```sql
   -- In Supabase SQL Editor
   SELECT cron.schedule(
     'auto-release-escrow-hourly',
     '0 * * * *',
     $$
     SELECT net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/auto-release-escrow',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer <service-role-key>"}'::jsonb
     );
     $$
   );
   ```

**Cron Expression Meaning:**

```
0 * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, Sunday = 0 or 7)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)

0 * * * * = Every hour at minute 0 (1:00, 2:00, 3:00, etc.)
```

**Verification:**

- Wait 1 hour
- Check Edge Function logs for execution
- Or manually trigger: `POST https://<project-ref>.supabase.co/functions/v1/auto-release-escrow`

---

### Task 5: Update Checkout Flow (Verification) ✅ ALREADY DONE

**File:** `mobile-app/app/(tabs)/(orders)/checkout.tsx`

**Current Implementation:**

```typescript
// Platform fee calculation
const platformFeePercentage = 5.0;
const platformFee = Math.round(orderTotal * 0.05 * 100) / 100;
const vendorPayout = Math.round((orderTotal - platformFee) * 100) / 100;

// Order creation with escrow
const { error } = await supabase.from("orders").insert({
  // ... other fields
  escrow_status: "held",
  platform_fee_percentage: 5.0,
  platform_fee_amount: platformFee,
  vendor_payout_amount: vendorPayout,
  payout_status: "on_hold",
});
```

**Verify:**

- [x] Platform fee calculated correctly (5%)
- [x] Vendor payout calculated correctly (95%)
- [x] Escrow fields set on order creation
- [x] No changes needed - already correct

---

### Task 6: Update Order Delivery Flow (Verification) ✅ ALREADY DONE

**File:** `mobile-app/app/(tabs)/(sell)/order-detail.tsx`

**Current Implementation:**

```typescript
// When vendor marks order as delivered
if (newStatus === "delivered") {
  const { data, error } = await supabase.rpc("set_order_delivered", {
    p_order_id: orderId,
    p_release_delay_hours: 24,
  });

  // Show success alert
  Alert.alert(
    "Order Delivered",
    "Funds will be released to your wallet in 24 hours. Customers have a 24-hour window to report issues.",
    [{ text: "OK" }],
  );
}
```

**Verify:**

- [x] Calls `set_order_delivered()` RPC
- [x] Sets 24-hour delay
- [x] Shows vendor notification
- [x] No changes needed - already correct

---

### Task 7: Test End-to-End Payment Flow 🧪 TESTING

**Goal:** Verify entire payment flow works

**Test Scenario:**

1. **Create Test Order**

   ```
   Customer account: test-customer@example.com
   Vendor account: test-vendor@example.com
   Order amount: ₦10,000
   ```

2. **Complete Payment**
   - Add products to cart
   - Go to checkout
   - Use Paystack test card: `4084084084084081`
   - Complete payment

3. **Verify Order Created**

   ```sql
   SELECT
     id, status, total,
     escrow_status, platform_fee_amount, vendor_payout_amount,
     payout_status, eligible_for_release_at
   FROM orders
   WHERE id = '<order-id>';
   ```

   **Expected:**
   - total: 10000
   - escrow_status: 'held'
   - platform_fee_amount: 500
   - vendor_payout_amount: 9500
   - payout_status: 'on_hold'
   - eligible_for_release_at: NULL

4. **Vendor Confirms & Processes**
   - Login as vendor
   - Confirm order (status: confirmed → processing)
   - Verify stock decremented

5. **Vendor Marks Delivered**
   - Update status to delivered
   - Verify RPC called
   - Check alert shown

6. **Verify Escrow Scheduled**

   ```sql
   SELECT
     escrow_status, eligible_for_release_at, payout_status
   FROM orders
   WHERE id = '<order-id>';
   ```

   **Expected:**
   - escrow_status: 'held'
   - eligible_for_release_at: NOW() + 24 hours
   - payout_status: 'on_hold'

7. **Wait 24+ Hours OR Manually Trigger Release**

   ```sql
   -- Manual release for testing (skip 24hr wait)
   SELECT release_escrow_to_vendor('<order-id>');
   ```

8. **Verify Wallet Credited**

   ```sql
   -- Check vendor wallet
   SELECT balance FROM wallets WHERE user_id = '<vendor-id>';

   -- Check transaction log
   SELECT * FROM wallet_transactions
   WHERE user_id = '<vendor-id>'
   ORDER BY created_at DESC
   LIMIT 1;

   -- Check platform earnings
   SELECT * FROM platform_earnings
   WHERE order_id = '<order-id>';
   ```

   **Expected:**
   - Wallet balance: +9500
   - Transaction type: 'escrow_release'
   - Platform earnings: 500

9. **Verify Analytics Updated**
   - Login as vendor
   - Check analytics page
   - Wallet Balance: ₦9,500
   - Total Revenue: ₦9,500 (not ₦10,000)
   - In Escrow: ₦0

**Success Criteria:**

- ✅ Order created with correct escrow amounts
- ✅ Delivery schedules release (24hr timer)
- ✅ Auto-release credits vendor wallet
- ✅ Platform earnings recorded
- ✅ Analytics show correct vendor earnings

---

### Task 8: Monitor & Debug 🔍 ONGOING

**Setup Monitoring:**

1. **Edge Function Logs**

   ```
   Supabase Dashboard → Edge Functions → auto-release-escrow → Logs
   ```

   **Watch for:**
   - Hourly executions
   - `released_count` > 0 when orders eligible
   - No errors in logs

2. **Database Queries for Monitoring**

   ```sql
   -- Total funds in escrow (across all vendors)
   SELECT SUM(vendor_payout_amount) as total_escrow
   FROM orders
   WHERE escrow_status = 'held';

   -- Orders pending release (next 24 hours)
   SELECT COUNT(*) as pending_release
   FROM orders
   WHERE escrow_status = 'held'
     AND eligible_for_release_at <= NOW() + INTERVAL '24 hours';

   -- Failed releases (stuck orders)
   SELECT id, vendor_id, vendor_payout_amount, eligible_for_release_at
   FROM orders
   WHERE escrow_status = 'held'
     AND eligible_for_release_at < NOW() - INTERVAL '1 hour'
     AND payment_status = 'paid';

   -- Platform earnings today
   SELECT SUM(amount) as today_earnings, COUNT(*) as orders_count
   FROM platform_earnings
   WHERE collected_at::DATE = CURRENT_DATE;

   -- Vendor wallet balances
   SELECT
     p.full_name,
     w.balance,
     w.updated_at
   FROM wallets w
   JOIN profiles p ON w.user_id = p.id
   WHERE p.role = 'vendor'
   ORDER BY w.balance DESC;
   ```

3. **Create Monitoring Dashboard (Future)**
   - Total escrow held
   - Pending releases count
   - Failed releases alert
   - Platform revenue
   - Vendor payout completion rate

**Debug Failed Releases:**

```sql
-- Find stuck order
SELECT * FROM orders WHERE id = '<stuck-order-id>';

-- Check wallet exists
SELECT * FROM wallets WHERE user_id = '<vendor-id>';

-- Manually release
SELECT release_escrow_to_vendor('<stuck-order-id>');

-- Check error logs
SELECT * FROM wallet_transactions
WHERE reference LIKE '%<order-id>%';
```

---

## 🎯 Success Checklist

- [ ] **Task 1:** Revenue calculations fixed (vendor_payout_amount used)
- [ ] **Task 2:** Escrow migration deployed successfully
- [ ] **Task 3:** auto-release-escrow Edge Function deployed
- [ ] **Task 4:** Cron schedule configured (0 \* \* \* \*)
- [ ] **Task 5:** Checkout flow verified (already correct)
- [ ] **Task 6:** Order delivery flow verified (already correct)
- [ ] **Task 7:** End-to-end test passed
- [ ] **Task 8:** Monitoring queries saved for ongoing use

---

## 📊 Expected Results

### Before Fix:

- ❌ Wallet Balance: ₦0
- ❌ Total Revenue: ₦29,000 (customer payment)
- ❌ Escrow never releases
- ❌ Vendors never get paid

### After Fix:

- ✅ Wallet Balance: ₦27,550 (actual earnings)
- ✅ Total Revenue: ₦27,550 (vendor payout)
- ✅ Escrow releases 24hrs after delivery
- ✅ Vendors see correct earnings
- ✅ Platform earns 5% commission (₦1,450)

---

## 🚨 Rollback Plan

If something breaks:

1. **Disable Cron**

   ```sql
   SELECT cron.unschedule('auto-release-escrow-hourly');
   ```

2. **Revert Revenue Calculations**

   ```typescript
   // Temporarily revert to old calculation
   const totalRevenue = deliveredOrders.reduce(
     (sum, o) => sum + Number(o.total),
     0,
   );
   ```

3. **Manual Release Individual Orders**

   ```sql
   SELECT release_escrow_to_vendor('<order-id>');
   ```

4. **Check Migration Status**

   ```sql
   -- Verify functions exist
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name LIKE '%escrow%';

   -- If missing, re-run migration
   ```

---

## 📝 Notes

- **Test with small amounts first** (₦100 orders)
- **Monitor hourly releases** for first 24 hours
- **Keep Paystack in test mode** until verified
- **Document any issues** encountered during deployment
- **Backup database** before running migration

---

**End of Payment Workflow Tasks**  
**Priority:** Complete all 8 tasks in order  
**Estimated Time:** 2-3 hours (excluding 24hr test wait)
