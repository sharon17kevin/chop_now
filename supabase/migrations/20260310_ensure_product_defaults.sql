-- Migration: Ensure Product Default Values and Constraints
-- Date: 2026-03-10
-- Description: Ensures all products have proper default values and adds NOT NULL constraints
--              for minimum_order_quantity to maintain data integrity

BEGIN;

-- ============================================================================
-- ENSURE ALL PRODUCTS HAVE DEFAULT VALUES
-- ============================================================================

-- Update any products with NULL minimum_order_quantity to default of 1
UPDATE products 
SET minimum_order_quantity = 1
WHERE minimum_order_quantity IS NULL;

-- Update any products with NULL bulk_discount_tiers to empty array
UPDATE products 
SET bulk_discount_tiers = '[]'::jsonb
WHERE bulk_discount_tiers IS NULL;

-- ============================================================================
-- ADD NOT NULL CONSTRAINTS
-- ============================================================================

-- Add NOT NULL constraint to minimum_order_quantity
-- All products must have a minimum order quantity (defaults to 1)
ALTER TABLE products
ALTER COLUMN minimum_order_quantity SET NOT NULL;

-- Add NOT NULL constraint to bulk_discount_tiers
-- Already set in the column creation, but ensuring it here
-- (Products without bulk discounts have an empty array: [])
ALTER TABLE products
ALTER COLUMN bulk_discount_tiers SET NOT NULL;

-- ============================================================================
-- ENSURE DEFAULT VALUES FOR FUTURE INSERTS
-- ============================================================================

-- Ensure minimum_order_quantity has default of 1
ALTER TABLE products
ALTER COLUMN minimum_order_quantity SET DEFAULT 1;

-- Ensure bulk_discount_tiers has default of empty array
ALTER TABLE products
ALTER COLUMN bulk_discount_tiers SET DEFAULT '[]'::jsonb;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after deployment to verify:

-- 1. Check that no products have NULL values:
-- SELECT COUNT(*) as null_moq_count
-- FROM products
-- WHERE minimum_order_quantity IS NULL;
-- Expected: 0

-- SELECT COUNT(*) as null_discounts_count
-- FROM products
-- WHERE bulk_discount_tiers IS NULL;
-- Expected: 0

-- 2. Check column constraints:
-- SELECT column_name, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'products' 
-- AND column_name IN ('minimum_order_quantity', 'bulk_discount_tiers');
-- Expected: is_nullable = 'NO' for both

-- 3. Verify all products have valid values:
-- SELECT 
--     COUNT(*) as total_products,
--     COUNT(*) FILTER (WHERE minimum_order_quantity >= 1) as valid_moq_count,
--     COUNT(*) FILTER (WHERE jsonb_array_length(bulk_discount_tiers) <= 2) as valid_discount_count
-- FROM products;
-- Expected: all counts should be equal
