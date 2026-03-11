-- Migration: Add bulk pricing and order increments support
-- Date: 2026-03-10
-- Description: Adds order_increment and bulk_discount_tiers columns to products table,
--              along with helper functions for calculating bulk discounts

BEGIN;

-- Add order_increment column for specifying minimum increment quantities
-- Example: If increment is 5, customers can only order in multiples of 5 (5, 10, 15, etc.)
ALTER TABLE products
ADD COLUMN order_increment INTEGER;

-- Add constraint to ensure increment is always positive if specified
ALTER TABLE products
ADD CONSTRAINT products_order_increment_positive
CHECK (order_increment IS NULL OR order_increment >= 1);

-- Add comment for documentation
COMMENT ON COLUMN products.order_increment IS 'Minimum increment for ordering this product (e.g., 5 means order in multiples of 5). NULL means no increment requirement.';

-- Add bulk_discount_tiers column for tiered quantity-based discounts
-- Structure: JSONB array of objects with min_quantity and discount_percent
-- Example: [{"min_quantity": 10, "discount_percent": 10}, {"min_quantity": 50, "discount_percent": 20}]
-- Maximum of 2 tiers allowed
ALTER TABLE products
ADD COLUMN bulk_discount_tiers JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Add constraint to limit maximum 2 discount tiers
ALTER TABLE products
ADD CONSTRAINT products_max_two_discount_tiers
CHECK (jsonb_array_length(bulk_discount_tiers) <= 2);

-- Add comment for documentation
COMMENT ON COLUMN products.bulk_discount_tiers IS 'Array of bulk discount tiers (max 2). Each tier has min_quantity (integer) and discount_percent (1-100). Ordered by min_quantity ascending.';

-- Create index on order_increment for filtering products with increment requirements
CREATE INDEX idx_products_order_increment
ON products(order_increment)
WHERE order_increment IS NOT NULL;

-- Create GIN index on bulk_discount_tiers for JSONB queries
CREATE INDEX idx_products_bulk_discounts
ON products USING GIN (bulk_discount_tiers);

-- Helper function: Get applicable discount percentage for a given quantity
-- Returns the highest applicable discount percentage (0-100)
-- Example: get_bulk_discount_percent('product-uuid', 25) -> 10 (if tier 1 is 10+ -> 10% off)

CREATE OR REPLACE FUNCTION get_bulk_discount_percent(
    p_product_id UUID,
    p_quantity INTEGER
) RETURNS NUMERIC AS $$
DECLARE
    v_discount_tiers JSONB;
    v_tier JSONB;
    v_max_discount NUMERIC := 0;
    v_min_qty INTEGER;
    v_discount_pct NUMERIC;
BEGIN
    -- Get the discount tiers for this product
    SELECT bulk_discount_tiers INTO v_discount_tiers
    FROM products
    WHERE id = p_product_id;

    -- If no tiers or empty array, return 0
    IF v_discount_tiers IS NULL OR jsonb_array_length(v_discount_tiers) = 0 THEN
        RETURN 0;
    END IF;

    -- Loop through tiers to find highest applicable discount
    FOR v_tier IN SELECT * FROM jsonb_array_elements(v_discount_tiers)
    LOOP
        v_min_qty := (v_tier->>'min_quantity')::INTEGER;
        v_discount_pct := (v_tier->>'discount_percent')::NUMERIC;

        -- If quantity meets or exceeds this tier's minimum, update max discount
        IF p_quantity >= v_min_qty AND v_discount_pct > v_max_discount THEN
            v_max_discount := v_discount_pct;
        END IF;
    END LOOP;

    RETURN v_max_discount;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment for documentation
COMMENT ON FUNCTION get_bulk_discount_percent(UUID, INTEGER) IS 'Returns the highest applicable bulk discount percentage (0-100) for a given product and quantity. Returns 0 if no discount applies.';

-- Helper function: Calculate discounted price per unit
-- Returns the per-unit price after applying bulk discount
-- Example: calculate_bulk_price('product-uuid', 25) -> 90.00 (if base price is 100 and 10% discount applies)

CREATE OR REPLACE FUNCTION calculate_bulk_price(
    p_product_id UUID,
    p_quantity INTEGER
) RETURNS NUMERIC AS $$
DECLARE
    v_base_price NUMERIC;
    v_discount_percent NUMERIC;
    v_discounted_price NUMERIC;
BEGIN
    -- Get the base price for this product
    SELECT price INTO v_base_price
    FROM products
    WHERE id = p_product_id;

    -- If product not found, return NULL
    IF v_base_price IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get applicable discount percentage
    v_discount_percent := get_bulk_discount_percent(p_product_id, p_quantity);

    -- Calculate discounted price: base_price * (1 - discount_percent/100)
    v_discounted_price := v_base_price * (1 - v_discount_percent / 100);

    RETURN v_discounted_price;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment for documentation
COMMENT ON FUNCTION calculate_bulk_price(UUID, INTEGER) IS 'Returns the per-unit price after applying bulk discount for a given product and quantity. Returns base price if no discount applies.';

-- ============================================================================
-- UPDATE EXISTING PRODUCTS WITH DEFAULT VALUES
-- ============================================================================

-- Ensure all existing products have empty bulk discount tiers if NULL
-- (This handles products created before this migration)
UPDATE products 
SET bulk_discount_tiers = '[]'::jsonb
WHERE bulk_discount_tiers IS NULL;

-- Ensure all existing products have minimum_order_quantity = 1 if NULL
-- (Belt-and-suspenders approach to ensure data consistency)
UPDATE products 
SET minimum_order_quantity = 1
WHERE minimum_order_quantity IS NULL;

COMMIT;

-- Verification queries (run these manually to verify migration success):
--
-- 1. Check new columns exist:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'products' AND column_name IN ('order_increment', 'bulk_discount_tiers');
--
-- 2. Check constraints:
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name IN ('products_order_increment_positive', 'products_max_two_discount_tiers');
--
-- 3. Check indexes:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'products' AND indexname IN ('idx_products_order_increment', 'idx_products_bulk_discounts');
--
-- 4. Check functions exist:
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_name IN ('get_bulk_discount_percent', 'calculate_bulk_price');
--
-- 5. Test discount calculation:
-- -- First, create a test product with discounts:
-- INSERT INTO products (vendor_id, name, price, category, stock, unit, order_increment, bulk_discount_tiers)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000',  -- Replace with actual vendor UUID
--     'Test Bulk Product',
--     100.00,
--     'Vegetables',
--     1000,
--     'kg',
--     5,
--     '[{"min_quantity": 10, "discount_percent": 10}, {"min_quantity": 50, "discount_percent": 20}]'::jsonb
-- );
--
-- -- Test the discount calculation:
-- SELECT 
--     get_bulk_discount_percent(id, 5) as discount_at_5,    -- Should be 0
--     get_bulk_discount_percent(id, 10) as discount_at_10,  -- Should be 10
--     get_bulk_discount_percent(id, 50) as discount_at_50,  -- Should be 20
--     calculate_bulk_price(id, 5) as price_at_5,            -- Should be 100.00
--     calculate_bulk_price(id, 10) as price_at_10,          -- Should be 90.00
--     calculate_bulk_price(id, 50) as price_at_50           -- Should be 80.00
-- FROM products
-- WHERE name = 'Test Bulk Product';
