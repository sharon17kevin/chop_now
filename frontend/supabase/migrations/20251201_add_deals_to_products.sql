-- Add deal-related columns to products table
-- Migration: 20251201_add_deals_to_products
-- Created: December 1, 2025

-- Add deal fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sale_ends_at TIMESTAMP;

-- Add index for faster querying of active deals
CREATE INDEX IF NOT EXISTS idx_products_on_sale 
ON products(is_on_sale, sale_ends_at) 
WHERE is_on_sale = TRUE;

-- Add index for sorting by discount
CREATE INDEX IF NOT EXISTS idx_products_discount 
ON products(discount_percentage DESC) 
WHERE is_on_sale = TRUE;

-- Comment on columns
COMMENT ON COLUMN products.original_price IS 'Original price before discount';
COMMENT ON COLUMN products.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN products.is_on_sale IS 'Whether product is currently on sale';
COMMENT ON COLUMN products.sale_ends_at IS 'When the sale ends (NULL means no expiry)';

-- Sample data: Mark 10 random products as hot deals (30% off for 3 days)
-- You can remove this section if you want to manually set deals
UPDATE products 
SET 
  is_on_sale = TRUE,
  original_price = price / 0.7, -- Set original price so current price is 30% off
  discount_percentage = 30,
  sale_ends_at = NOW() + INTERVAL '3 days'
WHERE id IN (
  SELECT id FROM products 
  WHERE is_available = TRUE
  ORDER BY RANDOM() 
  LIMIT 10
);

-- Function to automatically disable expired deals (optional)
CREATE OR REPLACE FUNCTION disable_expired_deals()
RETURNS void AS $$
BEGIN
  UPDATE products
  SET is_on_sale = FALSE
  WHERE is_on_sale = TRUE
    AND sale_ends_at IS NOT NULL
    AND sale_ends_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- You can set up a cron job to run this function periodically
-- Or call it when fetching products in your application
