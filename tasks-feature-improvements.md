# Chow Marketplace - Cleanup & Improvement Tasks

**Last Updated:** March 3, 2026  
**Status:** Ready for AI Agent (Cline) Execution  
**Priority System:** 🔴 High | 🟡 Medium | 🟢 Low

---

## 📖 How to Use This File

This task list is designed for systematic execution by Cline (Claude Code). Each task includes:

- **Clear objective** with expected outcome
- **File locations** with specific line numbers
- **Testing steps** to verify success
- **Dependencies** on other tasks

**Recommended Workflow:**

1. Start with all 🔴 High Priority tasks in order
2. Test thoroughly after each task
3. Move to 🟡 Medium Priority for optimization
4. Consider 🟢 Low Priority for polish

**Before Starting:**

- Review `ARCHITECTURE.md` for system context
- Ensure you have access to Supabase CLI
- Have a test Paystack account ready

---

## 🔴 HIGH PRIORITY TASKS

### Task 1: Fix Revenue Calculations (30 min)

**Issue:** Analytics show customer payment total (₦29,000) instead of vendor earnings (₦27,550)

**Root Cause:** Using `order.total` instead of `vendor_payout_amount` (which is 95% after 5% platform fee)

**Files to Change:**

1. **`frontend/hooks/useVendorEarnings.ts`**
   - **Line 41-42:** Update totalRevenue calculation
   - **Line 53:** Update monthlyRevenue calculation
   - **Line 69:** Update avgOrderValue calculation

2. **`frontend/hooks/useVendorStats.ts`**
   - **Line 73-74:** Update topProducts revenue calculation

**Changes Required:**

```typescript
// BEFORE (useVendorEarnings.ts line 41-42)
const totalRevenue = orders?.reduce(
  (sum, order) => sum + (order.total || 0), 0
) || 0;

// AFTER
const totalRevenue = orders?.reduce(
  (sum, order) => sum + (order.vendor_payout_amount || order.total * 0.95), 0
) || 0;

// BEFORE (useVendorEarnings.ts line 53)
const monthlyRevenue = currentMonthOrders.reduce(
  (sum, order) => sum + (order.total || 0), 0
);

// AFTER
const monthlyRevenue = currentMonthOrders.reduce(
  (sum, order) => sum + (order.vendor_payout_amount || order.total * 0.95), 0
);

// BEFORE (useVendorEarnings.ts line 69)
const avgOrderValue = totalRevenue / orders.length;

// AFTER - No change needed, uses updated totalRevenue

// BEFORE (useVendorStats.ts line 73-74)
revenue: products.reduce((sum, p) => sum + (p.total || 0), 0),

// AFTER
revenue: products.reduce((sum, p) => sum + (p.vendor_payout_amount || p.total * 0.95), 0),
```

**Expected Outcome:**

- Analytics page shows ₦27,550 instead of ₦29,000 for a ₦29k order
- Monthly revenue reflects vendor's actual earnings (95% of total)
- Top products show correct vendor revenue per item

**Testing:**

1. Navigate to `(sell)/analytics` page
2. Verify "Total Revenue" shows ~5% less than before
3. Check that growth % recalculates correctly
4. Verify top products revenue is accurate

**Dependencies:** None - can be done immediately

---

### Task 2: Add Database Indexes for Performance (15 min)

**Issue:** Queries are slow as data grows (no indexes on common filters)

**Impact:** Vendor order queries, escrow release queries, product searches all scan full tables

**Action Required:**

Create new migration file: `supabase/migrations/20260303_add_performance_indexes.sql`

**Migration Content:**

```sql
-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_vendor_status
  ON orders(vendor_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_customer_status
  ON orders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_escrow_eligible
  ON orders(eligible_for_release_at)
  WHERE escrow_status = 'held' AND payment_status = 'paid';

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category_available
  ON products(category, is_available);

CREATE INDEX IF NOT EXISTS idx_products_vendor_available
  ON products(vendor_id, is_available);

-- Wallet transactions for audit trail
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created
  ON wallet_transactions(user_id, created_at DESC);

-- Reviews for product ratings
CREATE INDEX IF NOT EXISTS idx_reviews_product
  ON reviews(product_id)
  WHERE deleted_at IS NULL;

-- Promo codes for checkout
CREATE INDEX IF NOT EXISTS idx_promo_codes_active
  ON promo_codes(code)
  WHERE is_active = true AND deleted_at IS NULL;

COMMENT ON INDEX idx_orders_escrow_eligible IS 'Optimizes auto-release-escrow Edge Function query';
COMMENT ON INDEX idx_orders_vendor_status IS 'Speeds up vendor order list and analytics';
COMMENT ON INDEX idx_products_category_available IS 'Optimizes product browse and search';
```

**Expected Outcome:**

- Vendor order queries execute in <100ms (currently ~500ms)
- Product search responds faster
- Auto-release escrow function finds eligible orders quickly

**Testing:**

1. Run migration: `supabase db push`
2. Check indexes created: `\di` in psql
3. Query vendor orders, measure response time
4. Check Supabase dashboard for query performance

**Dependencies:** None

---

### Task 3: Deploy Escrow System (45 min)

**Issue:** Wallet balance shows ₦0 because escrow never releases

**Root Cause:**

- Escrow migration not applied
- Auto-release Edge Function not deployed
- Cron schedule not set

**Steps:**

**3a. Apply Escrow Migration**

```bash
# Check if migration already applied
supabase db diff --use-migra

# If not, apply it
supabase db push
```

**Verify Tables:**

- `vendor_payouts` exists
- `platform_earnings` exists
- `orders` has escrow columns (escrow_status, eligible_for_release_at, etc.)
- `wallets` has balance column

**3b. Deploy Auto-Release Edge Function**

```bash
cd supabase/functions
supabase functions deploy auto-release-escrow --no-verify-jwt

# Verify deployment
supabase functions list
```

**3c. Configure Cron Schedule**

In Supabase Dashboard → Database → Cron Jobs:

```sql
-- Run every hour to check for eligible escrow releases
SELECT cron.schedule(
  'auto-release-escrow',
  '0 * * * *',  -- Every hour at :00
  $$
  SELECT net.http_post(
    url := 'https://[your-project-ref].supabase.co/functions/v1/auto-release-escrow',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
```

**3d. Test End-to-End Escrow Flow**

Create test scenario:

1. Customer places order (₦1,000)
2. Vendor marks order as delivered
3. Wait 24+ hours (or manually update `eligible_for_release_at` to past date)
4. Trigger auto-release: `curl -X POST https://[project].supabase.co/functions/v1/auto-release-escrow`
5. Verify:
   - Order `escrow_status` = 'released'
   - Vendor wallet balance increased by ₦950
   - Platform earnings record created for ₦50
   - Wallet transaction logged

**Expected Outcome:**

- Vendors see wallet balance update after 24hrs post-delivery
- Platform earns 5% commission automatically
- Audit trail created in wallet_transactions

**Testing:**

1. Create dummy order
2. Mark as delivered
3. Manually set `eligible_for_release_at = NOW() - INTERVAL '1 hour'`
4. Trigger function manually
5. Check wallet balance increased

**Dependencies:** Task 2 (indexes help escrow query performance)

---

### Task 4: Simplify Analytics Money Display (30 min)

**Issue:** Analytics page confusing with multiple money metrics

**Current State:**

- Shows "In Escrow" and "Wallet Balance"
- No clear explanation of what each means
- Users don't understand when they can withdraw

**Action Required:**

**Files to Update:**

1. **`frontend/app/(sell)/analytics.tsx`**

**Changes:**

```typescript
// Add helper tooltips/descriptions to money cards

// In Escrow Card - Add subtitle
<View style={styles.statCard}>
  <Banknote size={24} color="#f97316" />
  <Text style={styles.statLabel}>In Escrow</Text>
  <Text style={styles.helpText}>Locked until delivery + 24hrs</Text>
  <Text style={styles.statValue}>₦{fundsInEscrow.toLocaleString()}</Text>
</View>

// Wallet Balance Card - Add subtitle
<View style={styles.statCard}>
  <Wallet size={24} color="#22c55e" />
  <Text style={styles.statLabel}>Wallet Balance</Text>
  <Text style={styles.helpText}>Available to withdraw</Text>
  <Text style={styles.statValue}>₦{walletData?.balance.toLocaleString() || 0}</Text>
</View>

// Add new "Total Revenue" card for lifetime earnings
<View style={styles.statCard}>
  <TrendingUp size={24} color="#3b82f6" />
  <Text style={styles.statLabel}>Total Revenue</Text>
  <Text style={styles.helpText}>All-time earnings (95% of sales)</Text>
  <Text style={styles.statValue}>₦{totalRevenue.toLocaleString()}</Text>
</View>
```

**Add Styles:**

```typescript
helpText: {
  fontSize: 12,
  color: '#6b7280',
  marginTop: 4,
},
```

**Expected Outcome:**

- Vendors understand what each number means
- Clear distinction between locked and available funds
- Reduced support questions about "where's my money?"

**Testing:**

1. View analytics as vendor
2. Verify all three cards show
3. Confirm help text is readable
4. Test with different screen sizes

**Dependencies:** Task 1 (revenue calculation fix)

---

## 🟡 MEDIUM PRIORITY TASKS

### Task 5: Consolidate Duplicate Order Queries (1 hour)

**Issue:** Order data fetched inconsistently across multiple components

**Current State:**

- `useVendorEarnings` fetches orders with certain fields
- `useVendorStats` fetches orders with different fields
- `order-detail` fetches full order inline
- No shared hook, duplicated logic

**Action Required:**

Create shared hook: **`frontend/hooks/useOrders.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Shared type
export interface Order {
  id: string;
  total: number;
  vendor_payout_amount: number;
  status: string;
  payment_status: string;
  escrow_status: string;
  created_at: string;
  delivered_at: string;
  eligible_for_release_at: string;
  user_id: string;
  vendor_id: string;
  // ... other fields
}

// Get single order
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, profiles!user_id(*), products(*)")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

// Get vendor orders
export function useVendorOrders(vendorId: string) {
  return useQuery({
    queryKey: ["vendor-orders", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!vendorId,
  });
}

// Get customer orders
export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: ["orders", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(*), profiles!vendor_id(*)")
        .eq("user_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}
```

**Update Dependent Files:**

1. **`useVendorEarnings.ts`** - Replace inline query with `useVendorOrders`
2. **`useVendorStats.ts`** - Replace inline query with `useVendorOrders`
3. **`order-detail.tsx`** - Replace inline query with `useOrder`
4. **`orders.tsx`** - Use `useVendorOrders` instead of inline fetch

**Expected Outcome:**

- Single source of truth for order queries
- Consistent field selection
- Better TypeScript typing
- Shared cache keys (TanStack Query optimization)

**Testing:**

1. Check all vendor pages still work
2. Verify no duplicate network requests
3. Test query invalidation after order updates

**Dependencies:** Task 1 (uses correct revenue fields)

---

### Task 6: Generate TypeScript Types from Supabase (20 min)

**Issue:** Many `any` types in codebase, weak type safety

**Action Required:**

**6a. Generate Types**

```bash
# From project root
npx supabase gen types typescript --local > frontend/lib/database.types.ts
```

**6b. Update Supabase Client**

```typescript
// frontend/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
);
```

**6c. Update Hooks with Proper Types**

```typescript
// Example: useVendorOrders
import { Database } from "@/lib/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

export function useVendorOrders(vendorId: string) {
  return useQuery<Order[]>({
    // ...
  });
}
```

**Expected Outcome:**

- Full TypeScript autocomplete for database queries
- Catch type errors at compile time
- IDE hints for table columns and relationships

**Testing:**

1. Build app: `npm run build`
2. Check for new TypeScript errors
3. Fix any type mismatches found
4. Verify autocomplete works in VS Code

**Dependencies:** None

---

### Task 7: Add React Error Boundaries (45 min)

**Issue:** App crashes on unhandled errors with blank screen

**Action Required:**

**7a. Create Error Boundary Component**

Create **`frontend/components/ErrorBoundary.tsx`**

```typescript
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to error reporting service (e.g., Sentry)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <View style={styles.container}>
          <AlertTriangle size={48} color="#ef4444" />
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

**7b. Wrap Root Layout**

Update **`frontend/app/_layout.tsx`**

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* existing layout */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

**7c. Add Query Error Handling**

Update **`frontend/app/_layout.tsx`** (QueryClient config)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error("Query error:", error);
        // Optional: Show toast notification
      },
    },
    mutations: {
      onError: (error) => {
        console.error("Mutation error:", error);
        // Optional: Show toast notification
      },
    },
  },
});
```

**Expected Outcome:**

- App shows friendly error screen instead of crashing
- Users can retry failed operations
- Errors logged for debugging

**Testing:**

1. Trigger error (e.g., invalid query)
2. Verify error boundary catches it
3. Click "Try Again" and verify recovery
4. Check console for error logs

**Dependencies:** None

---

### Task 8: Optimize React Query Cache Configuration (30 min)

**Issue:** Inconsistent cache behavior, some data too stale, other data refetches too often

**Action Required:**

**8a. Review Current Query Configurations**

Audit all `useQuery` calls for:

- Missing `staleTime` (defaults to 0 = always stale)
- Missing `cacheTime` (defaults to 5 min)
- No query invalidation on mutations

**8b. Set Appropriate Staleness**

```typescript
// Fast-changing data (orders, cart): 1 minute
useQuery({
  queryKey: ["vendor-orders", vendorId],
  staleTime: 60 * 1000, // 1 minute
  // ...
});

// Slow-changing data (products, profile): 5 minutes
useQuery({
  queryKey: ["products"],
  staleTime: 5 * 60 * 1000, // 5 minutes
  // ...
});

// Static data (categories, settings): 1 hour
useQuery({
  queryKey: ["categories"],
  staleTime: 60 * 60 * 1000, // 1 hour
  // ...
});
```

**8c. Add Query Invalidation on Mutations**

Example: When order status updates, invalidate order queries

```typescript
// In order-detail.tsx
const updateStatusMutation = useMutation({
  mutationFn: updateOrderStatus,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    queryClient.invalidateQueries({ queryKey: ["vendor-stats"] });
  },
});
```

**Files to Update:**

- All components with `useMutation`
- All hooks with `useQuery`

**Expected Outcome:**

- Reduced unnecessary network requests
- Fresh data when needed
- Better app performance
- Lower bandwidth usage

**Testing:**

1. Monitor network tab in debugger
2. Verify queries don't refetch unnecessarily
3. Confirm data updates after mutations
4. Test with slow network (airplane mode on/off)

**Dependencies:** Task 5 (shared hooks make this easier)

---

## 🟢 LOW PRIORITY TASKS

### Task 9: Extract Inline Styles to StyleSheet (2 hours)

**Issue:** Many components use inline styles, hurts performance

**Action Required:**

Convert all inline `style={{}}` to `StyleSheet.create()` definitions

**Example:**

```typescript
// BEFORE
<View style={{ padding: 16, backgroundColor: '#fff' }}>
  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Title</Text>
</View>

// AFTER
<View style={styles.container}>
  <Text style={styles.title}>Title</Text>
</View>

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

**Files to Update:**

- All `.tsx` files in `frontend/app/`
- All `.tsx` files in `frontend/components/`

**Expected Outcome:**

- Better rendering performance (styles created once, not on every render)
- Easier to maintain and update styles

**Testing:**

1. Visual regression test (nothing should look different)
2. Performance profiling (should see minor improvement)

**Dependencies:** None

---

### Task 10: Add Loading State Consistency (1.5 hours)

**Issue:** Some screens show ActivityIndicator, others show nothing, some show custom loaders

**Action Required:**

**10a. Create Standard Loading Component**

Create **`frontend/components/LoadingState.tsx`**

```typescript
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingState({ message = 'Loading...', size = 'large' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color="#f97316" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});
```

**10b. Create Empty State Component**

Create **`frontend/components/EmptyState.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PackageOpen } from 'lucide-react-native';

interface Props {
  icon?: any;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = PackageOpen, title, message, action }: Props) {
  return (
    <View style={styles.container}>
      <Icon size={64} color="#d1d5db" />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#374151',
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  action: {
    marginTop: 24,
  },
});
```

**10c. Standardize Usage**

Replace all custom loading states with shared components:

```typescript
// In any component with useQuery
const { data, isLoading, error } = useQuery(...);

if (isLoading) return <LoadingState message="Loading orders..." />;
if (error) return <ErrorState error={error} />;
if (!data?.length) return <EmptyState title="No orders yet" />;

return <View>{/* render data */}</View>;
```

**Expected Outcome:**

- Consistent UX across all screens
- Easier to update loading states globally
- Better perceived performance

**Testing:**

1. Navigate through all app screens
2. Verify loading states look consistent
3. Test with slow network (throttling)

**Dependencies:** Task 7 (error boundary)

---

### Task 11: Add Unit Tests for Critical Hooks (3 hours)

**Issue:** No tests, refactoring is risky

**Action Required:**

**11a. Setup Testing Infrastructure**

```bash
npm install --save-dev @testing-library/react-native @testing-library/react-hooks jest
```

**11b. Create Test for useVendorEarnings**

Create **`frontend/hooks/__tests__/useVendorEarnings.test.ts`**

```typescript
import { renderHook, waitFor } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVendorEarnings } from '../useVendorEarnings';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: mockOrders,
          error: null,
        })),
      })),
    })),
  },
}));

const mockOrders = [
  {
    total: 1000,
    vendor_payout_amount: 950,
    status: 'delivered',
    escrow_status: 'released',
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    total: 2000,
    vendor_payout_amount: 1900,
    status: 'delivered',
    escrow_status: 'released',
    created_at: '2026-03-02T00:00:00Z',
  },
];

describe('useVendorEarnings', () => {
  it('calculates total revenue correctly', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useVendorEarnings('vendor-123'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.totalRevenue).toBe(2850); // 950 + 1900
  });

  it('calculates average order value correctly', async () => {
    // ... test implementation
  });

  // More tests...
});
```

**11c. Test Critical Paths**

Priority tests:

- Revenue calculations
- Order status filtering
- Escrow calculations
- Growth percentage calculations

**Expected Outcome:**

- Confidence in refactoring
- Catch regressions early
- Document expected behavior

**Testing:**

```bash
npm test
```

**Dependencies:** Task 5 (shared hooks), Task 6 (types)

---

### Task 12: Create Developer Documentation (2 hours)

**Issue:** New developers need to ramp up quickly

**Action Required:**

Create **`docs/DEVELOPER_GUIDE.md`**

```markdown
# Developer Guide - Chow Marketplace

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase CLI
- Paystack test account

### Local Setup

1. Clone repo
2. `npm install`
3. Copy `.env.example` to `.env.local`
4. `supabase start`
5. `npx expo start`

## Project Structure

[Explain folder organization]

## Common Tasks

- Adding a new screen
- Creating a new database table
- Updating RLS policies
- Testing payment flow

## Code Conventions

- TypeScript strict mode
- ESLint rules
- Component naming
- File organization

## Testing

- Unit tests with Jest
- E2E tests with Detox
- Manual testing checklist

## Deployment

- Building for iOS
- Building for Android
- Deploying Edge Functions
- Running migrations

## Troubleshooting

- Common errors and fixes
```

**Expected Outcome:**

- Faster developer onboarding
- Consistent code practices
- Reference for common tasks

**Dependencies:** None

---

## ✅ Task Completion Checklist

After completing each task:

- [ ] Code changes made
- [ ] Manual testing completed
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] Updated ARCHITECTURE.md if needed
- [ ] Committed changes with clear message
- [ ] Moved task to "Done" section below

---

## 📊 Progress Tracker

### Done ✅

- [x] Initial architecture documentation
- [x] Removed Top Customers feature
- [x] Simplified money display (removed "Releasing Soon")

### In Progress 🔄

- [ ] (Add tasks as you start them)

### Blocked 🚫

- [ ] (Add any blocked tasks with reason)

---

## 🎯 Success Metrics

After completing all High Priority tasks:

- ✅ Revenue calculations show vendor earnings (95% of total)
- ✅ Wallet balance increases after escrow releases
- ✅ Database queries execute in <100ms
- ✅ Analytics page clear and understandable
- ✅ No TypeScript `any` types in critical paths
- ✅ App doesn't crash on errors (error boundaries work)

---

## 📝 Notes for Cline

**Best Practices:**

1. Always read ARCHITECTURE.md before starting a task
2. Make one change at a time, test thoroughly
3. If you see something that needs fixing outside current task, note it for later
4. Ask for clarification if expected outcome is unclear
5. Update this file as you complete tasks

**When Stuck:**

- Check ARCHITECTURE.md for system context
- Review existing code patterns
- Search for similar implementations
- Ask human for guidance

**What Not to Do:**

- Don't make changes without understanding impact
- Don't skip testing steps
- Don't merge multiple unrelated changes
- Don't remove code that might be used elsewhere

---

**Ready to start? Begin with Task 1: Fix Revenue Calculations**
