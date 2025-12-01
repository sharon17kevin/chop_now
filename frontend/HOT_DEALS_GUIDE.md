# Hot Deals Implementation Guide

## ✅ What Was Implemented

### 1. Database Changes

- Added `original_price`, `discount_percentage`, `is_on_sale`, and `sale_ends_at` columns to products table
- Created indexes for optimal query performance
- Added function to disable expired deals automatically

### 2. TypeScript Updates

- Updated `Product` interface with new deal fields
- Replaced `getTopRated()` with `getHotDeals()` selector
- Selector sorts deals by discount percentage (highest first)
- Fallback: Shows regular products if no deals exist

### 3. UI Updates

- Changed "Top Rated Near You" to "🔥 Hot Deals Near You"
- Updated `DestinationMiniCard` to show dynamic discount badge
- Badge only appears when `discount > 0`
- Styled with red background for visibility

---

## 🚀 How to Set Up Deals

### Option 1: Run Migration File (Automated)

```bash
# Navigate to your Supabase project
cd supabase

# Run the migration
supabase migration run 20251201_add_deals_to_products

# Or apply via Supabase dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of migrations/20251201_add_deals_to_products.sql
# 3. Run the query
```

The migration automatically:

- Adds all necessary columns
- Marks 10 random products as 30% off deals (expires in 3 days)
- Creates indexes for performance

### Option 2: Manually Set Deals (More Control)

```sql
-- Example 1: Create a 40% off flash sale (ends in 24 hours)
UPDATE products
SET
  is_on_sale = TRUE,
  original_price = 5000,
  discount_percentage = 40,
  price = 3000,
  sale_ends_at = NOW() + INTERVAL '24 hours'
WHERE id = 'YOUR_PRODUCT_ID';

-- Example 2: Create a permanent deal (no expiry)
UPDATE products
SET
  is_on_sale = TRUE,
  original_price = 2000,
  discount_percentage = 25,
  price = 1500,
  sale_ends_at = NULL
WHERE name = 'Tomatoes';

-- Example 3: Mark multiple products as deals
UPDATE products
SET
  is_on_sale = TRUE,
  original_price = price * 1.5, -- 33% off
  discount_percentage = 33,
  sale_ends_at = NOW() + INTERVAL '7 days'
WHERE category = 'Fruits'
  AND stock > 50
LIMIT 5;
```

---

## 🔄 Managing Deals

### Disable Expired Deals Manually

```sql
-- Call this function to disable expired deals
SELECT disable_expired_deals();
```

### View Active Deals

```sql
SELECT
  id,
  name,
  category,
  original_price,
  price,
  discount_percentage,
  sale_ends_at
FROM products
WHERE is_on_sale = TRUE
  AND (sale_ends_at IS NULL OR sale_ends_at > NOW())
ORDER BY discount_percentage DESC;
```

### Remove Deal from Product

```sql
UPDATE products
SET
  is_on_sale = FALSE,
  price = original_price,
  original_price = NULL,
  discount_percentage = 0,
  sale_ends_at = NULL
WHERE id = 'YOUR_PRODUCT_ID';
```

---

## 📱 How It Works in the App

1. **Home Screen**: "Hot Deals Near You" carousel shows products with `is_on_sale = true`
2. **Sorting**: Deals sorted by discount percentage (highest discounts first)
3. **Badge Display**: Red badge shows "{discount}% OFF" on product cards
4. **Expiry**: Deals with `sale_ends_at` in the past are automatically filtered out
5. **Fallback**: If no deals exist, shows first 10 regular products

---

## 🎨 Customization Options

### Change Badge Color

Edit `DestinationCard.tsx` line ~258:

```tsx
backgroundColor: '#DC2626', // Change this to your brand color
```

### Change Carousel Speed

Edit `index.tsx` line ~384:

```tsx
autoPlayInterval={3000} // Change milliseconds (currently 3 seconds)
```

### Change Number of Deals Shown

Edit `useProductStore.ts` in `getHotDeals()`:

```tsx
.slice(0, 10) // Change this number
```

### Show Countdown Timer

Add to `DestinationMiniCard`:

```tsx
{
  sale_ends_at && (
    <Text style={{ color: colors.error, fontSize: 11 }}>
      Ends: {new Date(sale_ends_at).toLocaleDateString()}
    </Text>
  );
}
```

---

## 🧪 Testing

1. **Run the migration** to set up the database
2. **Restart Expo** to pick up the changes: `npx expo start --clear`
3. **Check logs** for: `🏠 Products updated: { hotDeals: X }`
4. **Verify UI** shows red discount badges on deal products

---

## 📊 Database Schema

```sql
products (
  ...existing columns...,
  original_price DECIMAL(10, 2),      -- Price before discount
  discount_percentage INTEGER,         -- 0-100
  is_on_sale BOOLEAN,                 -- Active flag
  sale_ends_at TIMESTAMP              -- NULL = no expiry
)
```

---

## 🐛 Troubleshooting

**No deals showing?**

- Check if any products have `is_on_sale = TRUE`
- Run: `SELECT COUNT(*) FROM products WHERE is_on_sale = TRUE;`

**Badge not showing?**

- Verify `discount_percentage > 0`
- Check console logs for product data

**Deals showing expired products?**

- Run: `SELECT disable_expired_deals();`
- Or filter in query: `WHERE sale_ends_at IS NULL OR sale_ends_at > NOW()`
