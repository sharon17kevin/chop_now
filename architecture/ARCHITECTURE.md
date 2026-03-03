# Chow - Farm-to-Table Marketplace

## Complete System Architecture

**Generated:** March 2, 2026  
**Status:** MVP Complete - Optimization Required  
**Platform:** React Native (Expo) + Supabase

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
- **Payment Processing:** Paystack integration with escrow system
- **Escrow Management:** 24-hour hold period after delivery before releasing vendor payments

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

**wallets**

```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles, unique)
- balance (numeric, default: 0)
- created_at (timestamp)
- updated_at (timestamp)
```

**wallet_transactions**

```sql
- id (uuid, PK)
- wallet_id (uuid, FK to wallets)
- user_id (uuid, FK to profiles)
- amount (numeric)
- type (text: 'credit' | 'debit')
- transaction_type (text: 'deposit' | 'withdrawal' | 'refund' | 'escrow_release' | 'purchase')
- reference (text)
- description (text)
- metadata (jsonb)
- created_at (timestamp)
```

**payments**

```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- amount (numeric)
- currency (text, default: 'NGN')
- status (text: 'pending' | 'success' | 'failed')
- reference (text, unique)
- payment_method (text: 'card' | 'bank_transfer' | 'ussd' | 'dedicated_nuban')
- paystack_reference (text)
- authorization_code (text)
- metadata (jsonb)
- verified_at (timestamp)
- created_at (timestamp)
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

**2. auto-release-escrow**

- **Path:** `/functions/v1/auto-release-escrow`
- **Trigger:** Cron (hourly: `0 * * * *`)
- **Actions:**
  - Query orders eligible for release
  - Call `auto_release_eligible_escrow()` RPC
  - Process up to 100 orders per run
  - Return `{released_count, failed_count}`
- **Status:** Created, needs deployment

### RPC Functions (PostgreSQL)

**Escrow Management**

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

**Wallet Management**

```sql
-- Credit user wallet
credit_wallet(p_user_id, p_amount, p_type, p_reference)
  RETURNS: wallet record
  ACTIONS:
    - Create wallet if not exists
    - Increment balance
    - Create transaction record

-- Debit user wallet
debit_wallet(p_user_id, p_amount, p_type, p_reference)
  RETURNS: wallet record
  ACTIONS:
    - Check sufficient balance
    - Decrement balance
    - Create transaction record
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

## ⚠️ Known Issues

### Critical Issues

**1. Wallet Balance Shows ₦0**

- **Cause:** Escrow system not fully deployed
- **Impact:** Vendors can't see their earnings
- **Fix:** Deploy migration + Edge Function + cron
- **Status:** Code ready, deployment pending

**2. Revenue Shows Customer Payment Total**

- **Cause:** Using `order.total` instead of `vendor_payout_amount`
- **Impact:** Analytics show inflated revenue (includes 5% fee)
- **Fix:** Update hooks to use `vendor_payout_amount`
- **Files:** `useVendorEarnings.ts`, `useVendorStats.ts`
- **Status:** Fix needed

**3. Auto-Release Not Running**

- **Cause:** Edge Function not deployed
- **Impact:** Escrow never releases, vendors don't get paid
- **Fix:** `supabase functions deploy auto-release-escrow`
- **Status:** Code ready, deployment pending

### Medium Priority Issues

**4. Money Tracking Complexity**

- **Issue:** Multiple sources of truth (escrow vs wallet)
- **Impact:** Confusion about available funds
- **Fix:** Simplify analytics to show only wallet balance
- **Status:** Partially fixed (removed "Releasing Soon" card)

**5. Top Customer Calculation**

- **Issue:** Removed but query inefficient
- **Impact:** N/A (feature removed)
- **Status:** Cleaned up

**6. Payment Webhook Race Condition**

- **Issue:** Frontend might poll before webhook processes
- **Impact:** Order creation might fail intermittently
- **Fix:** Add retry logic or optimistic locking
- **Status:** Rare occurrence, needs monitoring

### Low Priority Issues

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
