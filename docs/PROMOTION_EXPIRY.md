# Promotion Expiry System

This document explains the two-layer protection system for expired promotions.

## Layer 1: Client-Side Filtering (Real-time)

### Overview

The frontend filters out expired promotions in real-time before displaying them to users.

### Implementation

1. **Helper Function**: `isDiscountActive(product)` in [useProductStore.ts](../mobile-app/stores/useProductStore.ts)
   - Checks if `is_on_sale === true`
   - Verifies `discount_percentage > 0`
   - Validates `sale_ends_at` hasn't passed

2. **Selector Updates**:
   - `getHotDeals()`: Only returns products with active, non-expired discounts
   - `getFreshPicks()`: Strips discount fields from expired promotions for display

3. **UI Component Protection**:
   - [GridProductCard.tsx](../mobile-app/components/cards/GridProductCard.tsx): Checks `isDiscountActive()` before showing discount badge
   - [DestinationCard.tsx](../mobile-app/components/cards/DestinationCard.tsx): Validates expiry before displaying discount banner and savings

### Benefits

- Immediate protection - expired discounts never show to users
- No database lag - works even if database cleanup hasn't run yet
- Better UX - users never see misleading prices

## Layer 2: Database Cleanup (Scheduled)

### Overview

Automatically cleans up expired promotions daily to maintain database hygiene.

### Migration

Run migration: [20260122_add_daily_promotion_cleanup.sql](../supabase/migrations/20260122_add_daily_promotion_cleanup.sql)

```sql
-- This migration creates:
-- 1. cleanup_expired_promotions() function
-- 2. get_expired_promotions_count() helper function
```

### Setup Options

#### Option A: Supabase pg_cron (Recommended)

Use Supabase's built-in cron scheduler:

1. Enable pg_cron in Supabase Dashboard:
   - Go to Database → Extensions
   - Enable `pg_cron`

2. Run in SQL Editor:

```sql
SELECT cron.schedule(
  'cleanup-expired-promotions',
  '0 1 * * *', -- 1 AM daily
  $$SELECT cleanup_expired_promotions()$$
);
```

3. Verify cron job:

```sql
SELECT * FROM cron.job;
```

#### Option B: Supabase Edge Functions

Use Edge Functions with Supabase's cron triggers:

1. Create Edge Function:

```typescript
// supabase/functions/cleanup-promotions/index.ts
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { error } = await supabaseClient.rpc("cleanup_expired_promotions");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: count } = await supabaseClient.rpc(
    "get_expired_promotions_count",
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: "Cleanup complete",
      expired_count: count,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
```

2. Deploy:

```bash
supabase functions deploy cleanup-promotions
```

3. Schedule in Supabase Dashboard:
   - Go to Edge Functions → cleanup-promotions
   - Enable Cron Trigger: `0 1 * * *` (1 AM daily)

#### Option C: External Cron Service

Use services like:

- **GitHub Actions** (free for public repos)
- **Vercel Cron** (free tier available)
- **EasyCron** or **cron-job.org**

Example GitHub Actions workflow:

```yaml
# .github/workflows/cleanup-promotions.yml
name: Cleanup Expired Promotions
on:
  schedule:
    - cron: "0 1 * * *" # 1 AM UTC daily
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            '${{ secrets.SUPABASE_URL }}/rest/v1/rpc/cleanup_expired_promotions' \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json"
```

### What Gets Cleaned Up

When a promotion expires, the cleanup function sets:

- `is_on_sale = false`
- `discount_percentage = 0`
- `original_price = null`
- `sale_ends_at = null`

This ensures:

- Database stays clean
- No orphaned discount data
- Clear promotion history

### Manual Cleanup

To manually trigger cleanup:

```sql
SELECT cleanup_expired_promotions();
```

To check how many promotions are expired:

```sql
SELECT get_expired_promotions_count();
```

## Testing

### Test Expired Discount

1. Create a promotion with `sale_ends_at` in the past:

```sql
UPDATE products
SET
  is_on_sale = true,
  discount_percentage = 25,
  original_price = 5000,
  sale_ends_at = NOW() - INTERVAL '1 day'
WHERE id = 'your-product-id';
```

2. Verify it doesn't appear in:
   - Hot Deals carousel
   - Fresh Picks discount badges
   - Product detail pages

3. Run cleanup:

```sql
SELECT cleanup_expired_promotions();
```

4. Verify discount fields are cleared:

```sql
SELECT
  name,
  is_on_sale,
  discount_percentage,
  original_price,
  sale_ends_at
FROM products
WHERE id = 'your-product-id';
```

## Monitoring

### Check Active Promotions

```sql
SELECT
  COUNT(*) as active_promotions,
  AVG(discount_percentage) as avg_discount
FROM products
WHERE is_on_sale = true
  AND (sale_ends_at IS NULL OR sale_ends_at > NOW());
```

### Check Expired Promotions (Before Cleanup)

```sql
SELECT
  id,
  name,
  discount_percentage,
  sale_ends_at,
  NOW() - sale_ends_at as time_expired
FROM products
WHERE is_on_sale = true
  AND sale_ends_at IS NOT NULL
  AND sale_ends_at < NOW()
ORDER BY sale_ends_at DESC;
```

## Architecture Benefits

### Why Two Layers?

1. **Client-side filtering**: Immediate protection, works in real-time
2. **Database cleanup**: Long-term hygiene, reduces query overhead

### Single-Table Design

- ✅ Simple and performant
- ✅ One discount per product (no ambiguity)
- ✅ Fast queries with proper indexes
- ✅ Easy to understand and maintain

### Alternative Considered

Separate promotions table was considered but rejected because:

- ❌ More complex queries (JOINs)
- ❌ Harder to maintain consistency
- ❌ Unnecessary for single-discount-per-product model
- ❌ No performance benefit for this use case

## Troubleshooting

### Expired Discounts Still Showing

1. Check client-side code is using `isDiscountActive()`
2. Verify React Query cache is fresh (try pull-to-refresh)
3. Check if `sale_ends_at` is set correctly

### Cleanup Not Running

1. Verify cron job is scheduled: `SELECT * FROM cron.job;`
2. Check cron job logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
3. Test function manually: `SELECT cleanup_expired_promotions();`

### Performance Issues

Current indexes:

```sql
-- Already created in 20251201_add_deals_to_products.sql
CREATE INDEX idx_products_on_sale ON products(is_on_sale, sale_ends_at) WHERE is_on_sale = TRUE;
CREATE INDEX idx_products_discount ON products(discount_percentage DESC) WHERE is_on_sale = TRUE;
```

## Related Files

- Migration: [20260122_add_daily_promotion_cleanup.sql](../supabase/migrations/20260122_add_daily_promotion_cleanup.sql)
- Store: [useProductStore.ts](../mobile-app/stores/useProductStore.ts)
- Components:
  - [GridProductCard.tsx](../mobile-app/components/cards/GridProductCard.tsx)
  - [DestinationCard.tsx](../mobile-app/components/cards/DestinationCard.tsx)
