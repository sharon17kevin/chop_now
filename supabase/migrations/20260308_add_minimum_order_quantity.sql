-- Migration: Add Minimum Order Quantity to Products
-- Description: Adds minimum_order_quantity field to products table to allow vendors
--              to set minimum purchase quantities for their products
-- Date: March 8, 2026
-- Status: Ready for deployment

BEGIN;

-- ============================================================================
-- ADD MINIMUM ORDER QUANTITY FIELD
-- ============================================================================

-- Add minimum_order_quantity column to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS minimum_order_quantity INTEGER DEFAULT 1 CHECK (minimum_order_quantity >= 1);

-- Add comment for documentation
COMMENT ON COLUMN public.products.minimum_order_quantity IS 'Minimum quantity that must be purchased (default: 1)';

-- Create index for products with minimum order requirements > 1
CREATE INDEX IF NOT EXISTS idx_products_min_order_qty
ON public.products(minimum_order_quantity)
WHERE minimum_order_quantity > 1;

-- ============================================================================
-- UPDATE EXISTING PRODUCTS
-- ============================================================================

-- Set default minimum_order_quantity to 1 for all existing products
UPDATE public.products 
SET minimum_order_quantity = 1
WHERE minimum_order_quantity IS NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after deployment to verify:

-- Check if column was added successfully
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'products' AND column_name = 'minimum_order_quantity';

-- Check index creation
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'products' AND indexname = 'idx_products_min_order_qty';

-- Count products with minimum order quantity > 1
-- SELECT COUNT(*) as products_with_min_qty
-- FROM products
-- WHERE minimum_order_quantity > 1;
