# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chow (Chop N Cart) is a farm-to-table food marketplace built with React Native/Expo and Supabase. Multi-role platform: customers browse and order, vendors list products and fulfill orders, with a 24-hour escrow system and 5% platform commission.

## Development Commands

All commands run from `mobile-app/`:

```bash
npm start           # Start Expo dev server
npm run dev          # Same as start
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run on web
npm run build:web    # Export for web
npm run lint         # ESLint (expo lint)
```

Edge functions (from project root, requires Supabase CLI):

```bash
supabase functions deploy <function-name>    # Deploy single edge function
supabase functions serve                     # Local edge function dev server
```

No test framework is configured.

## Architecture

### Layered Data Flow

```
Component (app/) → Hook (hooks/) → Service (services/) → Supabase
                                        ↕
                                  Store (stores/) — UI state only
```

**Only `services/` should import from `@/lib/supabase`**. Components use hooks, hooks use services. Stores (Zustand) hold UI-only state like cart, search filters, and user profile cache.

Exception: `hooks/useAuth.tsx` and a few components still import supabase directly for auth listeners and `supabase.functions.invoke()` calls. This is acceptable for auth and edge function invocations.

### State Management

- **TanStack React Query v5** — server state, caching (5min stale, 10min gc, 1 retry, no refetch on focus)
- **Zustand** — client state (13 stores: cart, user, search, wishlist, products, etc.)
- **React Context** — theme only (via `hooks/useTheme.tsx`)

### Routing

Expo Router with file-based routing. Tab structure:

```
app/
├── index.tsx, login.tsx, signup.tsx, otp.tsx, forgot.tsx   # Auth screens
└── (tabs)/
    ├── (home)/          # Customer: browse, product details
    ├── (orders)/        # Customer: checkout, order tracking
    ├── (sell)/          # Vendor: analytics, stock, order management
    ├── (profile)/       # Settings, wallet, withdraw
    ├── (admin)/         # Admin panel
    └── search.tsx       # Search
```

### Provider Hierarchy

`GestureHandlerRootView` → `SafeAreaProvider` → `ThemeProvider` → `QueryProvider` → `AuthProvider` → `BottomSheetModalProvider` → `Stack`

### Backend — Supabase

- **Database**: PostgreSQL with RLS policies on all tables
- **Edge Functions**: Deno runtime, located at `mobile-app/supabase/functions/`
- **Migrations**: SQL files at `supabase/migrations/` (root level)
- **Auth**: Supabase Auth with OTP and Apple Sign-In
- **Client**: Initialized in `mobile-app/lib/supabase.ts`

### Payment System (Paystack)

Nigerian market, amounts in **kobo** (multiply naira by 100) for Paystack API calls.

**Order payment flow**: Customer pays → order created with `escrow_status='held'` → vendor delivers → `set_order_delivered()` sets 24hr hold → `auto-release-escrow` cron (hourly) calls `release_escrow_to_vendor()` → vendor wallet credited 95%, platform earns 5%.

**Wallet system**: `wallets` table (balance), `wallet_transactions` (audit trail), `credit_wallet()`/`debit_wallet()` RPCs with row-level locking.

**Withdrawal flow**: Vendor initiates from withdraw screen → `paystack-initiate-transfer` edge function → creates Paystack transfer recipient → debits wallet → initiates transfer. Webhook handles `transfer.success`/`transfer.failed`/`transfer.reversed`.

### Key Edge Functions

| Function                     | Purpose                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `paystack-webhook`           | Verifies Paystack signatures, processes payment/transfer events |
| `paystack-verify`            | Verifies transaction status                                     |
| `paystack-initiate-transfer` | Vendor withdrawal to bank account                               |
| `paystack-resolve-account`   | Bank account name verification                                  |
| `paystack-create-dva`        | Creates dedicated virtual account                               |
| `auto-release-escrow`        | Called by hourly cron, releases eligible escrows                |
| `process-refund`             | Refund processing                                               |

### Key Database RPCs

| Function                                    | Purpose                            |
| ------------------------------------------- | ---------------------------------- |
| `credit_wallet(p_user_id, p_amount, ...)`   | Credit wallet with row lock        |
| `debit_wallet(p_user_id, p_amount, ...)`    | Debit wallet with row lock         |
| `release_escrow_to_vendor(order_id)`        | Release single order escrow        |
| `auto_release_eligible_escrow()`            | Batch release all eligible         |
| `set_order_delivered(order_id, hold_hours)` | Mark delivered + set release timer |
| `get_wallet_balance(p_user_id)`             | Get current balance                |

## Path Aliases

`@/*` maps to `mobile-app/` root (configured in tsconfig.json).

## Environment Variables

Required in `.env` (see `.env.example`):

- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` — Paystack client key
- `PAYSTACK_SECRET_KEY` / `PAYSTACK_WEBHOOK_SECRET` — Paystack server (edge functions only)

## Important Context

- Currency is Nigerian Naira (₦). Paystack API expects amounts in kobo (₦1 = 100 kobo).
- The `order_type: 'product_purchase'` metadata field in checkout distinguishes order payments from wallet deposits — webhook and verify functions check this to avoid double-crediting wallet for order payments.
- `vendor_payout_amount` (not `order.total`) is the correct field for vendor revenue calculations. `total` is what the customer paid; vendor gets 95%.
- **Minimum Order Quantities**: Products can have a `minimum_order_quantity` field (default: 1). Cart validation enforces this minimum. Product cards display a badge when minimum > 1. Quantity selector starts at minimum and prevents decrement below it.
- Detailed architecture docs live in `architecture/ARCHITECTURE.md`. Task tracking in `tasks.md`.
