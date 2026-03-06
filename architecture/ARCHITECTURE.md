# Chow - Farm-to-Table Marketplace

## Complete System Architecture

**Generated:** March 3, 2026  
**Status:** Payment System Upgraded - Escrow Automation in Progress  
**Platform:** React Native (Expo) + Supabase  
**Last Updated:** Wallet System + Paystack Integration + Cron Job Setup

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Database Architecture](#database-architecture)
4. [API Layer](#api-layer)
5. [Frontend Architecture](#frontend-architecture)
6. [Data Flows](#data-flows)
7. [Money & Payment System](#money--payment-system)
8. [Security & Authentication](#security--authentication)
9. [Known Issues](#known-issues)
10. [Cleanup Priorities](#cleanup-priorities)

---

## 🏗️ System Overview

Chow is a farm-to-table marketplace connecting local farmers with customers. The platform handles:

- **Customer Features:** Browse products, shopping cart, checkout, order tracking, reviews
- **Vendor Features:** Product listing, stock management, order fulfillment, analytics, earnings
- **Payment Processing:** Paystack integration with DVA (Dedicated Virtual Accounts) support
- **Escrow Management:** 24-hour hold period after delivery with automated release via cron job
- **Wallet System:** Vendor wallets for balance tracking, transaction audit trail
- **Platform Revenue:** 5% commission on all completed orders, tracked separately

### Architecture Pattern

- **Frontend:** Single React Native app with role-based routing
- **Backend:** Supabase (PostgreSQL) with Row Level Security
- **API:** Edge Functions (Deno) + RPC Functions (PostgreSQL)
- **State Management:** TanStack Query for server state, local state in components

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** React Native 0.74.5
- **Router:** Expo Router (file-based routing)
- **State Management:**
  - TanStack Query v5 (server state)
  - React hooks (local state)
- **UI Components:** React Native components (custom-built)
- **Image Handling:** Expo ImagePicker
- **Location Services:** Expo Location
- **Icons:** lucide-react-native

### Backend

- **Database:** Supabase (PostgreSQL 15)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (product images, avatars)
- **Edge Functions:** Deno Runtime
- **Real-time:** Supabase Realtime (not yet implemented)

### Third-Party Services

- **Payments:** Paystack (Nigerian payment gateway)
- **Image Upload:** Cloudinary (via custom service)
- **Push Notifications:** Expo Notifications (partially implemented)

### Development Tools

- **Package Manager:** npm
- **Build Tool:** Expo EAS Build
- **TypeScript:** Yes (strict mode)
- **Linting:** ESLint
- **Version Control:** Git

---

## 📊 Database Architecture

### Table Structure

#### Core Tables

**profiles**

```sql
- id (uuid, FK to auth.users)
- email (text)
- full_name (text)
- phone (text)
- role (text: 'customer' | 'vendor' | 'admin')
- avatar_url (text)
- created_at (timestamp)
- updated_at (timestamp)
- is_vendor_approved (boolean)
- selected_address_id (uuid, FK to delivery_addresses)
- push_token (text)
- push_notifications_enabled (boolean)
```

**products**

```sql
- id (uuid, PK)
- vendor_id (uuid, FK to profiles)
- name (text)
- description (text)
- price (numeric)
- stock (integer)
- unit (text: 'kg', 'pieces', etc.)
- category (text: 'fruits', 'vegetables', etc.)
- images (text[])
- image_url (text, legacy)
- location (jsonb: {lat, lng, address})
- is_organic (boolean)
- is_available (boolean)
- status (text: 'pending' | 'approved' | 'rejected')
- created_at (timestamp)
- updated_at (timestamp)
```

**orders**

```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles) -- Customer
- vendor_id (uuid, FK to profiles)
- status (text: 'pending' | 'confirmed' | 'processing' | 'delivered' | 'cancelled')
- total (numeric)
- delivery_address (text)
- delivery_notes (text)
- payment_status (text: 'pending' | 'paid' | 'failed')
- payment_reference (text)
- created_at (timestamp)
- updated_at (timestamp)

-- Escrow fields
- escrow_status (text: 'held' | 'released' | 'reversed')
- funds_released_at (timestamp)
- eligible_for_release_at (timestamp)
- platform_fee_percentage (numeric, default: 5.00)
- platform_fee_amount (numeric)
- vendor_payout_amount (numeric)
- payout_status (text: 'on_hold' | 'pending' | 'processing' | 'completed' | 'failed')
- payout_reference (text)
- payout_completed_at (timestamp)
- release_hold_reason (text)
```

**order_items**

```sql
- id (uuid, PK)
- order_id (uuid, FK to orders)
- product_id (uuid, FK to products)
- quantity (integer)
- price (numeric)
- created_at (timestamp)
```

**wallets** ⚠️ MIGRATION READY - NOT YET DEPLOYED

```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles, unique)
- balance (numeric, default: 0.00, CHECK >= 0)
- currency (text, default: 'NGN')
- created_at (timestamp)
- updated_at (timestamp)

-- Indexes:
-- idx_wallets_user_id (user_id)
-- idx_wallets_balance (balance)

-- RLS: Users can SELECT their own wallet only
-- Updates via RPC functions only (credit_wallet, debit_wallet)
-- Migration: 20260303_create_wallet_system.sql
```

**wallet_transactions** ⚠️ MIGRATION READY - NOT YET DEPLOYED

```sql
- id (uuid, PK)
- wallet_id (uuid, FK to wallets)
- amount (numeric, NOT NULL)
- balance_before (numeric, NOT NULL)
- balance_after (numeric, NOT NULL)
- transaction_type (text: 'credit' | 'debit' | 'refund' | 'escrow_release' | 'withdrawal')
- description (text)
- reference (text, unique)
- metadata (jsonb)
- created_at (timestamp)

-- Indexes:
-- idx_wallet_transactions_wallet_id (wallet_id)
-- idx_wallet_transactions_reference (reference)
-- idx_wallet_transactions_created_at (created_at DESC)
-- idx_wallet_transactions_type (transaction_type)

-- RLS: Users can SELECT their own transactions only
-- Audit trail: NEVER DELETE, always create new record
-- Migration: 20260303_create_wallet_system.sql
```

**payments** ⚠️ MIGRATION READY - NOT YET DEPLOYED

```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- amount (numeric, NOT NULL)
- reference (text, unique, NOT NULL)
- status (text: 'pending' | 'success' | 'failed', default: 'pending')
- gateway (text, default: 'paystack')
- payment_method (text: 'card' | 'bank_transfer' | 'ussd' | 'dedicated_nuban')
- transaction_reference (text) -- Paystack transaction reference
- channel (text) -- Paystack channel
- ip_address (text)
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

-- Indexes:
-- idx_payments_user_id (user_id)
-- idx_payments_reference (reference)
-- idx_payments_status (status)
-- idx_payments_created_at (created_at DESC)

-- RLS: Users can SELECT their own payments only
-- Migration: 20260303_create_paystack_integration.sql
```

**virtual_accounts** ⚠️ MIGRATION READY - NOT YET DEPLOYED

```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles, unique)
- account_name (text, NOT NULL)
- account_number (text, NOT NULL)
- bank_name (text, NOT NULL)
- bank_code (text)
- customer_code (text) -- Paystack customer code
- is_active (boolean, default: true)
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

-- Indexes:
-- idx_virtual_accounts_user_id (user_id)
-- idx_virtual_accounts_account_number (account_number)

-- RLS: Users can SELECT their own DVA only
-- Purpose: Dedicated Virtual Accounts for top-ups via bank transfer
-- Migration: 20260303_create_paystack_integration.sql
```

**reviews**

```sql
- id (uuid, PK)
- order_id (uuid, FK to orders)
- product_id (uuid, FK to products)
- vendor_id (uuid, FK to profiles)
- user_id (uuid, FK to profiles) -- Reviewer
- rating (integer, 1-5)
- comment (text)
- created_at (timestamp)
```

#### Escrow Tables

**vendor_payouts**

```sql
- id (uuid, PK)
- vendor_id (uuid, FK to profiles)
- amount (numeric)
- status (text: 'pending' | 'processing' | 'completed' | 'failed')
- payment_method (text: 'bank_transfer' | 'wallet')
- order_ids (uuid[])
- paystack_transfer_id (text)
- transfer_code (text)
- initiated_at (timestamp)
- completed_at (timestamp)
- failure_reason (text)
```

**platform_earnings**

```sql
- id (uuid, PK)
- order_id (uuid, FK to orders)
- vendor_id (uuid, FK to profiles)
- amount (numeric)
- type (text: 'commission' | 'service_fee')
- description (text)
- percentage_charged (numeric)
- collected_at (timestamp)
```

#### Additional Tables

**promo_codes**

- Discount management
- Expiration tracking
- Usage limits

**delivery_addresses**

- Customer saved addresses
- Default address selection

**banners**

- Homepage promotional banners
- Admin-managed content

**search_analytics**

- Track search queries
- Product popularity metrics

**payment_refunds**

- Refund tracking
- Linked to original payments

---

## 🔌 API Layer

### Edge Functions (Supabase Functions)

**1. paystack-webhook**

- **Path:** `/functions/v1/paystack-webhook`
- **Trigger:** Paystack webhook events
- **Events Handled:**
  - `charge.success` - Payment confirmation
  - Dedicated NUBAN payments
- **Actions:**
  - Verify webhook signature
  - Record payment in database
  - Credit user wallet
  - Update order payment status
- **Security:** HMAC signature verification

**2. auto-release-escrow** ⚠️ READY - NEEDS DEPLOYMENT

- **Path:** `/functions/v1/auto-release-escrow`
- **Trigger:** Cron job (hourly: `0 * * * *`)
- **Actions:**
  - Query orders eligible for release (eligible_for_release_at <= NOW())
  - Call `auto_release_eligible_escrow()` RPC
  - Process up to 100 orders per run
  - Return `{released: count, failed: count, errors: []}`
- **Status:** Code ready, NOT deployed
- **Cron Setup:** Migration 20260303_setup_escrow_cron_job.sql

**3. paystack-create-dva** (Future)

- **Path:** `/functions/v1/paystack-create-dva`
- **Purpose:** Create Dedicated Virtual Account for user
- **Status:** Planned, not implemented

**4. paystack-verify** (Future)

- **Path:** `/functions/v1/paystack-verify`
- **Purpose:** Manually verify payment status
- **Status:** Planned, not implemented

### RPC Functions (PostgreSQL)

**Wallet Management** ⚠️ MIGRATION READY - NOT YET DEPLOYED

```sql
-- Credit vendor wallet (escrow release, refunds, top-ups)
credit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_reference text
)
  RETURNS: transaction_id (uuid)
  SECURITY: DEFINER
  ACTIONS:
    - Lock wallet FOR UPDATE
    - Add amount to balance
    - Create wallet_transaction record with balance_before/after
    - Auto-generate reference if not provided

-- Debit vendor wallet (withdrawals, purchases)
debit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_reference text
)
  RETURNS: transaction_id (uuid)
  SECURITY: DEFINER
  ACTIONS:
    - Lock wallet FOR UPDATE
    - Check sufficient balance
    - Subtract amount from balance
    - Create wallet_transaction record
    - Throw error if insufficient funds

-- Get current wallet balance
get_wallet_balance(p_user_id uuid)
  RETURNS: numeric
  SECURITY: INVOKER (RLS applies)
  ACTIONS:
    - SELECT balance FROM wallets WHERE user_id = p_user_id
```

**Escrow Management** ✅ DEPLOYED (20260127_create_escrow_system.sql)

```sql
-- Calculate escrow split
calculate_escrow_amounts(order_total, fee_percentage)
  RETURNS: {platform_fee, vendor_payout}

-- Mark order delivered and schedule release
set_order_delivered(p_order_id, p_release_delay_hours)
  RETURNS: order record
  ACTIONS:
    - Update order status to 'delivered'
    - Set eligible_for_release_at = NOW() + delay
    - Update escrow_status

-- Release escrow for specific order
release_escrow_to_vendor(p_order_id)
  RETURNS: success boolean
  ACTIONS:
    - Credit vendor wallet (vendor_payout_amount)
    - Record wallet transaction
    - Update escrow_status to 'released'
    - Record platform earnings
    - Update payout_status to 'pending'
    - Trigger notification

-- Batch release eligible escrows
auto_release_eligible_escrow()
  RETURNS: {released_count, failed_count}
  ACTIONS:
    - Find all eligible orders (delivered + 24hr passed)
    - Loop through and call release_escrow_to_vendor()
    - Track successes/failures
```

**Wallet Management** ⚠️ MIGRATION READY - NOT YET DEPLOYED

```sql
-- Credit user wallet (escrow release, refunds, top-ups)
credit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_reference text DEFAULT NULL
)
  RETURNS: transaction_id (uuid)
  SECURITY: DEFINER (bypasses RLS)
  ACTIONS:
    - Lock wallet FOR UPDATE (prevents race conditions)
    - Create wallet if doesn't exist
    - Add amount to balance
    - Create wallet_transaction record with balance snapshots
    - Auto-generate reference if not provided
  MIGRATION: 20260303_create_wallet_system.sql

-- Debit user wallet (withdrawals, purchases)
debit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_reference text DEFAULT NULL
)
  RETURNS: transaction_id (uuid)
  SECURITY: DEFINER (bypasses RLS)
  ACTIONS:
    - Lock wallet FOR UPDATE
    - Check sufficient balance
    - Subtract amount from balance
    - Create wallet_transaction record
    - Throw error if insufficient funds
  MIGRATION: 20260303_create_wallet_system.sql

-- Get current wallet balance
get_wallet_balance(p_user_id uuid)
  RETURNS: numeric
  SECURITY: INVOKER (RLS applies)
  ACTIONS:
    - SELECT balance FROM wallets WHERE user_id = p_user_id
    - Returns 0 if wallet doesn't exist
  MIGRATION: 20260303_create_wallet_system.sql
```

**Paystack Integration** ⚠️ MIGRATION READY - NOT YET DEPLOYED

```sql
-- Get user payment history
get_user_payment_history(p_user_id uuid, p_limit int DEFAULT 50)
  RETURNS: TABLE (payment records)
  SECURITY: INVOKER (RLS applies)
  MIGRATION: 20260303_create_paystack_integration.sql

-- Get user's Dedicated Virtual Account
get_user_virtual_account(p_user_id uuid)
  RETURNS: virtual_account record
  SECURITY: INVOKER (RLS applies)
  MIGRATION: 20260303_create_paystack_integration.sql

-- Get payment statistics
get_payment_stats(p_user_id uuid)
  RETURNS: TABLE (total_payments, successful_payments, total_amount)
  SECURITY: INVOKER (RLS applies)
  MIGRATION: 20260303_create_paystack_integration.sql
```

**Stock Management**

```sql
-- Auto-decrement stock on order confirmation
-- Trigger: AFTER UPDATE on orders (when status = 'confirmed')
```

**Other Functions**

- `get_vendor_rating()` - Calculate average rating
- `cleanup_expired_promotions()` - Remove old banners
- Various query helpers

---

## 📱 Frontend Architecture

### File Structure

```
mobile-app/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx              # Root layout, auth check
│   ├── +not-found.tsx           # 404 page
│   ├── (auth)/                  # Auth group (no tabs)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/                  # Main app (with tabs)
│       ├── _layout.tsx          # Tab navigator
│       ├── index.tsx            # Home/Browse
│       ├── search.tsx           # Search products
│       ├── cart.tsx             # Shopping cart
│       ├── profile.tsx          # User profile
│       ├── (orders)/            # Order flow
│       │   ├── checkout.tsx
│       │   ├── order-success.tsx
│       │   └── order-detail.tsx
│       └── (sell)/              # Vendor dashboard
│           ├── index.tsx        # Sell product form
│           ├── orders.tsx       # Vendor orders list
│           ├── order-detail.tsx # Order management
│           ├── analytics.tsx    # Earnings dashboard
│           └── stock.tsx        # Inventory management
├── components/
│   ├── AppHeader.tsx            # Reusable header
│   ├── SliderToggle.tsx         # Toggle component
│   └── [other components]
├── hooks/
│   ├── useAuth.ts               # Authentication state
│   ├── useFrameworkReady.ts     # App initialization
│   ├── useTheme.tsx             # Theme colors
│   ├── useVendorEarnings.ts     # Vendor revenue metrics
│   ├── useVendorStats.ts        # Vendor business stats
│   └── useVendorRating.ts       # Vendor rating average
├── lib/
│   ├── supabase.ts              # Supabase client config
│   └── uploadService.ts         # Image upload utilities
└── assets/
    └── images/                   # App images
```

### Key Routes

**Customer Routes**

- `/` - Browse products (index.tsx)
- `/search` - Search with filters
- `/cart` - Shopping cart
- `/(orders)/checkout` - Payment & checkout
- `/(orders)/order-success` - Order confirmation
- `/profile` - User settings

**Vendor Routes**

- `/(sell)` - Create product listing
- `/(sell)/orders` - Manage orders
- `/(sell)/order-detail/[orderId]` - Order details
- `/(sell)/analytics` - Earnings & metrics
- `/(sell)/stock` - Inventory management

**Auth Routes**

- `/(auth)/login` - User login
- `/(auth)/register` - User registration

### State Management

**TanStack Query Keys**

```typescript
// Orders
["orders", userId][("vendor-orders", vendorId)][("order", orderId)][
  ("pending-orders-count", vendorId)
][
  // Products
  "products"
][("vendor-products", vendorId)][("product", productId)][
  // Analytics
  ("vendor-earnings", vendorId)
][("vendor-stats", vendorId)][("vendor-rating", vendorId)][
  ("vendor-wallet", vendorId)
][
  // User
  ("profile", userId)
][("cart", userId)];
```

### Custom Hooks

**useAuth**

- Manages authentication state
- Provides `user`, `session`, `signIn()`, `signOut()`
- Listens to auth state changes

**useVendorEarnings**

- Fetches order data for vendor
- Calculates:
  - Total revenue (vendor_payout_amount)
  - Monthly revenue
  - Average order value
  - Funds in escrow
  - Revenue/order growth (%)

**useVendorStats**

- Orders by status breakdown
- Top products by revenue
- Unique customer count
- Low stock count (<10 units)

**useVendorRating**

- Fetches vendor reviews
- Calculates average rating
- Returns total review count

---

## 🌊 Data Flows

### 1. Order Creation Flow

```
User adds products to cart
        ↓
Navigates to checkout
        ↓
Selects delivery address
        ↓
Initiates Paystack payment
        ↓
[User redirected to Paystack]
        ↓
User completes payment
        ↓
Paystack sends webhook → paystack-webhook function
        ↓
Webhook verifies signature
        ↓
Records payment in payments table
        ↓
Credits user wallet (if wallet payment)
        ↓
Frontend polls payment status
        ↓
Creates order in orders table:
  - status: 'pending'
  - payment_status: 'paid'
  - escrow_status: 'held'
  - platform_fee_amount: total × 5%
  - vendor_payout_amount: total × 95%
  - payout_status: 'on_hold'
        ↓
Creates order_items records
        ↓
Triggers stock decrement (on order confirmation)
        ↓
Shows order success page
        ↓
Vendor sees order in their orders list
```

### 2. Order Fulfillment Flow

```
Vendor sees new order (status: 'pending')
        ↓
Vendor confirms order → status: 'confirmed'
  - Stock auto-decremented via trigger
        ↓
Vendor starts packing → status: 'processing'
        ↓
Vendor delivers order
        ↓
Vendor marks as delivered in app
        ↓
Calls set_order_delivered() RPC:
  - status: 'delivered'
  - eligible_for_release_at: NOW() + 24 hours
        ↓
Shows alert: "Funds will be released in 24 hours"
        ↓
[24-hour dispute window]
        ↓
auto-release-escrow function runs (hourly cron)
        ↓
Calls auto_release_eligible_escrow() RPC
        ↓
For each eligible order:
  - Calls release_escrow_to_vendor()
  - Credits vendor wallet (+vendor_payout_amount)
  - Records platform_earnings (+platform_fee_amount)
  - Updates escrow_status: 'released'
  - Updates payout_status: 'pending'
        ↓
Vendor wallet balance increases
        ↓
Vendor can withdraw funds (future feature)
```

### 3. Review Flow

```
Customer receives delivered order
        ↓
Opens order detail page
        ↓
Sees "Write Review" button
        ↓
Submits review with rating (1-5) and comment
        ↓
Creates record in reviews table:
  - order_id
  - product_id
  - vendor_id
  - user_id (reviewer)
  - rating
  - comment
        ↓
Vendor rating updates automatically
        ↓
Displays in vendor analytics
```

### 4. Product Listing Flow

```
Vendor accesses sell tab
        ↓
Fills product form:
  - Name, description, price
  - Stock quantity & unit
  - Category selection
  - Organic toggle
        ↓
Uploads 1-5 product images
  - Via Expo ImagePicker
  - Validates images (uploadService)
  - Uploads to Cloudinary/Supabase Storage
        ↓
Captures GPS location
  - Via Expo Location
  - Geocodes to address
        ↓
Submits product
        ↓
Creates product record:
  - status: 'pending' (requires admin approval)
  - is_available: true
  - All form data
        ↓
Shows success message
        ↓
Admin reviews product (future feature)
        ↓
Admin approves → status: 'approved'
        ↓
Product appears in customer browse
```

---

## 💰 Money & Payment System

### Payment Flow Architecture

#### Customer Payment → Escrow → Vendor Payout

```
Customer initiates checkout (₦10,000 order)
        ↓
Paystack processes payment
  - Method: Card/Bank Transfer/USSD/Dedicated Account
  - Customer charged: ₦10,000
        ↓
Payment webhook received
        ↓
Order created with escrow:
  ┌─────────────────────────────────┐
  │ Order Total: ₦10,000            │
  │                                 │
  │ Platform Fee (5%): ₦500         │
  │ Vendor Payout (95%): ₦9,500     │
  │                                 │
  │ escrow_status: 'held'           │
  │ payout_status: 'on_hold'        │
  └─────────────────────────────────┘
        ↓
Money held in escrow (not in vendor wallet)
        ↓
Vendor processes & delivers order
        ↓
Vendor marks delivered
  - eligible_for_release_at = NOW() + 24 hours
        ↓
[24-hour customer dispute window]
        ↓
If no disputes, escrow auto-releases:
  ┌─────────────────────────────────┐
  │ Vendor Wallet: +₦9,500          │
  │ Platform Earnings: +₦500        │
  │                                 │
  │ escrow_status: 'released'       │
  │ payout_status: 'pending'        │
  └─────────────────────────────────┘
        ↓
Vendor can withdraw to bank (future)
```

### Money Tracking Tables

**Current Balance: wallets table**

- Single source of truth for withdrawable funds
- Updated only when escrow releases

**In Transit: orders table (escrow fields)**

- Tracks money lifecycle
- From customer payment to vendor release

**Audit Trail: wallet_transactions table**

- Every credit/debit logged
- Searchable reference codes
- Metadata for debugging

**Revenue Tracking: platform_earnings table**

- 5% commission records
- Analytics for platform revenue

### Escrow States

| State              | escrow_status | payout_status | Meaning                        |
| ------------------ | ------------- | ------------- | ------------------------------ |
| **Locked**         | 'held'        | 'on_hold'     | Order not delivered yet        |
| **Releasing Soon** | 'held'        | 'on_hold'     | Delivered, within 24hrs        |
| **Released**       | 'released'    | 'pending'     | In vendor wallet, can withdraw |
| **Paid Out**       | 'released'    | 'completed'   | Transferred to bank            |
| **Reversed**       | 'reversed'    | 'failed'      | Refunded to customer           |

### Wallet Balance Calculation

**Correct Method (Current):**

```sql
SELECT balance FROM wallets WHERE user_id = vendor_id
```

**Funds Coming Soon:**

```sql
SELECT SUM(vendor_payout_amount)
FROM orders
WHERE vendor_id = ?
  AND escrow_status = 'held'
  AND payment_status = 'paid'
```

**Total Lifetime Earnings:**

```sql
SELECT SUM(vendor_payout_amount)
FROM orders
WHERE vendor_id = ?
  AND escrow_status = 'released'
```

---

## 🔐 Security & Authentication

### Row Level Security (RLS)

**All tables have RLS policies:**

**profiles table:**

- Users can read their own profile
- Users can update their own profile
- Public can read basic vendor info

**products table:**

- Anyone can read approved products
- Vendors can CRUD their own products
- Admins can approve products

**orders table:**

- Customers can read their own orders
- Vendors can read orders for their products
- Users can create orders

**wallets table:**

- Users can only read their own wallet
- System can update via RPC functions

**wallet_transactions table:**

- Users can only read their own transactions
- System creates via RPC functions

**vendor_payouts table:**

- Vendors can only see their own payouts
- Admins can see all

**platform_earnings table:**

- Admin access only

### Authentication Flow

```
User opens app
        ↓
Check Supabase session
        ↓
If session exists:
  - Load user profile
  - Navigate to main app
If no session:
  - Navigate to login screen
        ↓
User logs in with email/password
        ↓
Supabase Auth validates
        ↓
On success:
  - Session stored locally
  - JWT token issued
  - Profile loaded
  - Redirect to home
        ↓
All API calls include JWT
        ↓
Supabase validates JWT
        ↓
RLS policies check permissions
```

### Webhook Security

**Paystack Webhook Verification:**

```typescript
const signature = req.headers.get("x-paystack-signature");
const hash = createHmac("sha512", PAYSTACK_SECRET_KEY)
  .update(body)
  .digest("hex");

if (hash !== signature) {
  return Response("Invalid signature", 400);
}
```

---

## ⚠️ Known Issues & Deployment Status

### 🚨 Critical Issues (Blocking Vendor Payments)

**1. Wallet System NOT Deployed** 🔴 CRITICAL

- **Tables:** wallets, wallet_transactions
- **Functions:** credit_wallet(), debit_wallet(), get_wallet_balance()
- **Migration:** 20260303_create_wallet_system.sql ✅ Created, ❌ Not deployed
- **Impact:** Vendors cannot see wallet balance (shows ₦0), escrow releases will fail
- **Fix:** Deploy migration to Supabase
- **Status:** Ready for deployment
- **Time:** 2 minutes

**2. Paystack Integration NOT Deployed** 🔴 CRITICAL

- **Tables:** payments, virtual_accounts
- **Functions:** get_user_payment_history(), get_user_virtual_account(), get_payment_stats()
- **Migration:** 20260303_create_paystack_integration.sql ✅ Created, ❌ Not deployed
- **Impact:** Payment tracking incomplete, DVA feature unavailable
- **Fix:** Deploy migration to Supabase
- **Status:** Ready for deployment (idempotent with DROP IF EXISTS)
- **Time:** 2 minutes

**3. Auto-Release Edge Function NOT Deployed** 🔴 CRITICAL

- **Function:** auto-release-escrow
- **Path:** supabase/functions/auto-release-escrow/index.ts
- **Impact:** Escrow never releases, vendors never get paid
- **Fix:** Run `supabase functions deploy auto-release-escrow`
- **Status:** Code ready, needs deployment
- **Time:** 2 minutes

**4. Escrow Cron Job NOT Configured** 🔴 CRITICAL

- **Trigger:** Hourly cron (0 \* \* \* \*)
- **Migration:** 20260303_setup_escrow_cron_job.sql ✅ Created, ❌ Not deployed
- **Impact:** auto-release-escrow function never runs automatically
- **Fix:** Deploy cron migration, configure Supabase URL and Service Role Key
- **Status:** SQL template ready, needs manual config values
- **Time:** 5-8 minutes
- **Steps:**
  1. Run migration in Supabase SQL Editor
  2. Replace YOUR_SUPABASE_URL with project URL
  3. Replace YOUR_SERVICE_ROLE_KEY with key from Dashboard → Settings → API
  4. Verify cron created: `SELECT * FROM cron.job`

**Result of Above Issues:** Vendors see ₦0 wallet balance despite completed orders. Critical blocker for MVP launch.

---

### ⚠️ High Priority Issues

**5. Revenue Analytics Show Wrong Amount** 🟡 HIGH

- **Cause:** useVendorEarnings.ts uses `order.total` instead of `vendor_payout_amount`
- **Impact:** Analytics show customer payment amount (includes 5% platform fee)
  - Example: Shows ₦29,000 instead of ₦27,550
- **Fix Locations:**
  - hooks/useVendorEarnings.ts lines 41-42, 53, 69
  - Change to: `vendor_payout_amount || order.total * 0.95`
- **Status:** Bug identified, fix NOT applied
- **Time:** 5 minutes

**6. ProfileService Had Buggy Method** ✅ FIXED

- **Issue:** getProfileWalletBalance() queried non-existent profile.wallet_balance column
- **Fix:** Removed method, created useWallet.ts hook using getWalletBalance()
- **Status:** Fixed, separation of concerns enforced
- **Date:** March 3, 2026

**7. Separation of Concerns Violations** ✅ FIXED

- **Issue:** analytics.tsx had direct supabase imports and inline queries
- **Fix:** Refactored to use useWalletBalance() hook only
- **Status:** Fixed, architecture pattern enforced
- **Date:** March 3, 2026

---

### 📋 Medium Priority Issues

**8. Escrow Migration Status UNKNOWN** 🟡 MEDIUM

- **Migration:** 20260127_create_escrow_system.sql
- **Status:** Unknown if deployed to production
- **Verification:** Run `SELECT * FROM orders LIMIT 1` and check for escrow_status column
- **Impact:** If missing, entire escrow system won't work
- **Fix:** Deploy if not exists

**9. Payment Webhook Race Condition** 🟡 MEDIUM

- **Issue:** Frontend polls payment status before webhook processes
- **Impact:** Order creation might fail intermittently (rare)
- **Fix:** Add retry logic with exponential backoff
- **Status:** Low occurrence, needs monitoring

**10. N+1 Query Patterns** 🟡 MEDIUM

- **Location:** Order details pages may fetch items + products separately
- **Impact:** Performance degradation at scale
- **Fix:** Use Supabase joins or batch queries
- **Status:** Needs investigation

---

### 🔵 Low Priority / Future Enhancements

**11. Bank Withdrawal Feature** 🔵 FUTURE

- **Tables:** payout\_\* columns exist in profiles (payout_bank_code, payout_account_number, payout_account_name)
- **Purpose:** Allow vendors to withdraw wallet balance to bank account
- **Status:** Database ready, frontend NOT implemented
- **Priority:** Post-MVP

**12. Dedicated Virtual Accounts** 🔵 FUTURE

- **Table:** virtual_accounts (ready, not deployed)
- **Purpose:** Each user gets permanent bank account for instant top-ups
- **Integration:** Paystack DVA API
- **Status:** Migration ready, Edge Function planned
- **Priority:** Post-MVP

**13. Real-time Order Updates** 🔵 FUTURE

- **Tech:** Supabase Realtime subscriptions
- **Purpose:** Live notifications when order status changes
- **Status:** Supabase Realtime available, not implemented
- **Priority:** Nice to have

**14. Push Notifications Full Implementation** 🔵 FUTURE

- **Current:** Database fields exist (push_token, push_notifications_enabled)
- **Missing:** Expo push notification service integration
- **Status:** Partially implemented
- **Priority:** Nice to have

---

### 📊 Deployment Checklist (Critical Path)

To make payment system functional:

- [ ] **Deploy Wallet Migration** (2 min)
  - Run: 20260303_create_wallet_system.sql in Supabase SQL Editor
  - Verify: `SELECT COUNT(*) FROM wallets`

- [ ] **Deploy Paystack Migration** (2 min)
  - Run: 20260303_create_paystack_integration.sql in Supabase SQL Editor
  - Verify: `SELECT COUNT(*) FROM payments`

- [ ] **Deploy Escrow Migration (if missing)** (2 min)
  - Run: 20260127_create_escrow_system.sql
  - Verify: `SELECT escrow_status FROM orders LIMIT 1`

- [ ] **Deploy Auto-Release Edge Function** (2 min)
  - Command: `supabase functions deploy auto-release-escrow`
  - Verify: Check Dashboard → Edge Functions

- [ ] **Configure Cron Job** (8 min)
  - Run: 20260303_setup_escrow_cron_job.sql
  - Replace placeholders: YOUR_SUPABASE_URL, YOUR_SERVICE_ROLE_KEY
  - Verify: `SELECT * FROM cron.job WHERE jobname = 'auto-release-escrow-hourly'`

- [ ] **Manual Test** (10 min)
  - Create test order ₦10,000
  - Simulate payment (mark as paid)
  - Mark as delivered
  - Bypass 24hr wait: `UPDATE orders SET eligible_for_release_at = NOW() - INTERVAL '1 hour' WHERE id = 'TEST_ORDER_ID'`
  - Manually trigger: `curl -X POST 'YOUR_SUPABASE_URL/functions/v1/auto-release-escrow' -H 'Authorization: Bearer YOUR_ANON_KEY'`
  - Verify wallet credited: `SELECT balance FROM wallets WHERE user_id = 'VENDOR_ID'`
  - Should see: ₦9,500 (95% of ₦10,000)

- [ ] **Fix Revenue Analytics** (5 min)
  - Edit: hooks/useVendorEarnings.ts
  - Lines: 41-42, 53, 69
  - Change: `order.total` → `vendor_payout_amount || order.total * 0.95`

**Total Time:** ~30 minutes for full deployment and testing

**Success Criteria:**

- Vendor wallet shows balance > ₦0
- Auto-release runs hourly
- Revenue analytics show correct amounts
- Platform earnings track 5% fees

**7. Missing TypeScript Types**

- **Issue:** Some API responses not fully typed
- **Impact:** Type safety gaps
- **Fix:** Generate types from Supabase schema
- **Status:** Enhancement needed

**8. No Error Boundaries**

- **Issue:** App crashes on unhandled errors
- **Impact:** Poor UX
- **Fix:** Add React Error Boundaries
- **Status:** Enhancement needed

**9. No Loading States Consistency**

- **Issue:** Some screens show spinner, others nothing
- **Impact:** Inconsistent UX
- **Fix:** Create standard loading component
- **Status:** Enhancement needed

**10. Bank Account Verification Missing**

- **Issue:** Can't verify vendor bank accounts
- **Impact:** Payout fraud risk
- **Fix:** Integrate Paystack Account Verification API
- **Status:** Future feature

---

## 🎯 Cleanup Priorities

### High Priority (Do First)

**1. Fix Revenue Calculations**

- [ ] Update `useVendorEarnings.ts` lines 41-42, 53, 69
- [ ] Change `order.total` to `vendor_payout_amount || total * 0.95`
- [ ] Test analytics shows correct vendor earnings
- [ ] Verify growth percentages recalculate correctly

**2. Deploy Escrow System**

- [ ] Run migration: `20260127_create_escrow_system.sql`
- [ ] Deploy Edge Function: `supabase functions deploy auto-release-escrow`
- [ ] Set cron: `0 * * * *` in Supabase Dashboard
- [ ] Test with dummy order (mark delivered, wait 1hr, check wallet)

**3. Simplify Money Display**

- [ ] Remove confusing metrics from analytics
- [ ] Show only: Wallet Balance, In Escrow, Total Revenue
- [ ] Add tooltip/help text explaining each
- [ ] Document money flow in user-facing docs

**4. Add Missing Indexes**

```sql
-- Orders performance
CREATE INDEX idx_orders_vendor_status ON orders(vendor_id, status);
CREATE INDEX idx_orders_escrow_eligible ON orders(eligible_for_release_at)
  WHERE escrow_status = 'held';

-- Products search
CREATE INDEX idx_products_category_available ON products(category, is_available);
```

### Medium Priority (After MVP Fixes)

**5. Consolidate Duplicate Queries**

- [ ] Create shared hooks for common queries
- [ ] Example: `useOrder(orderId)` instead of inline queries
- [ ] Reduce code duplication

**6. Optimize React Query Cache**

- [ ] Review staleTime/cacheTime values
- [ ] Add query invalidation on mutations
- [ ] Implement optimistic updates for better UX

**7. Type Safety Improvements**

- [ ] Generate types: `supabase gen types typescript`
- [ ] Add to `lib/types.ts`
- [ ] Replace `any` types with proper interfaces

**8. Error Handling**

- [ ] Add React Error Boundaries
- [ ] Create error logging service (Sentry?)
- [ ] User-friendly error messages
- [ ] Retry logic for failed queries

**9. Testing Infrastructure**

- [ ] Unit tests for hooks
- [ ] Integration tests for payment flow
- [ ] E2E tests for critical paths
- [ ] Mock Paystack for testing

### Low Priority (Nice to Have)

**10. Code Organization**

- [ ] Group related components
- [ ] Extract business logic from components
- [ ] Create service layer for API calls
- [ ] Consistent naming conventions

**11. Performance Optimization**

- [ ] Lazy load routes
- [ ] Image optimization
- [ ] Reduce bundle size
- [ ] Add React.memo where appropriate

**12. Documentation**

- [ ] API documentation
- [ ] Component storybook
- [ ] Developer onboarding guide
- [ ] Architecture decision records (ADRs)

**13. Future Features**

- [ ] Real-time order updates
- [ ] Push notifications
- [ ] Chat between customer/vendor
- [ ] Automated bank transfers
- [ ] Admin dashboard
- [ ] Analytics dashboards (platform-wide)

---

## 📈 Metrics to Track

### Business Metrics

- Total orders per day/week/month
- Revenue (platform fee earnings)
- Customer acquisition rate
- Vendor acquisition rate
- Average order value
- Cart abandonment rate

### Technical Metrics

- API response times
- Database query performance
- Edge Function execution time
- Image upload success rate
- Payment success rate
- Escrow release success rate

### User Metrics

- Active users (DAU/MAU)
- Session duration
- Bounce rate
- Feature adoption rate
- NPS score

---

## 🚀 Deployment Checklist

### Database

- [x] Migrations applied
- [ ] Escrow migration applied
- [ ] Indexes created
- [ ] RLS policies verified
- [ ] Backup strategy in place

### Edge Functions

- [x] paystack-webhook deployed
- [ ] auto-release-escrow deployed
- [ ] Cron schedule set
- [ ] Environment variables set
- [ ] Logs monitored

### Frontend

- [ ] Build for production
- [ ] EAS Build configured
- [ ] Environment variables set
- [ ] App store metadata ready
- [ ] Screenshots prepared

### Third-Party Services

- [x] Paystack live keys configured
- [ ] Webhook endpoints registered
- [ ] IP whitelist updated (if any)
- [ ] Rate limits understood

### Monitoring

- [ ] Error tracking setup
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Payment monitoring
- [ ] Alert rules configured

---

## 📞 Support & Maintenance

### Critical Paths to Monitor

1. Payment webhook processing
2. Escrow auto-release
3. Stock decrement triggers
4. Wallet balance consistency

### Common Issues & Solutions

**Issue:** Order stuck in escrow  
**Solution:** Manually call `release_escrow_to_vendor(order_id)`

**Issue:** Wallet balance mismatch  
**Solution:** Audit wallet_transactions, recount balance

**Issue:** Payment webhook failure  
**Solution:** Check Paystack dashboard, replay webhook

**Issue:** Stock went negative  
**Solution:** Disable trigger, manually fix stock, re-enable

---

## 📚 Additional Resources

### Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Paystack Docs](https://paystack.com/docs)

### Code Repositories

- Frontend: `/mobile-app`
- Backend: `/supabase`
- Migrations: `/supabase/migrations`
- Edge Functions: `/supabase/functions`

### Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=

# Server-side (Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
```

---

**End of Architecture Document**  
**Last Updated:** March 2, 2026  
**Version:** 1.0
