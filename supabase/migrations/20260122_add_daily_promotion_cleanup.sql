-- Add automated daily cleanup of expired promotions
-- Migration: 20260122_add_daily_promotion_cleanup
-- Created: January 22, 2026

-- Enhanced function to clean up expired deals
-- This sets is_on_sale to FALSE and clears discount fields
CREATE OR REPLACE FUNCTION cleanup_expired_promotions()
RETURNS void AS $$
BEGIN
  UPDATE products
  SET 
    is_on_sale = FALSE,
    discount_percentage = 0,
    original_price = NULL,
    sale_ends_at = NULL
  WHERE is_on_sale = TRUE
    AND sale_ends_at IS NOT NULL
    AND sale_ends_at < NOW();
    
  -- Log the cleanup
  RAISE NOTICE 'Cleaned up expired promotions at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION cleanup_expired_promotions IS 'Cleans up expired promotions by setting is_on_sale to false and clearing discount fields';

-- Create a cron job to run daily cleanup at 1 AM
-- Note: Requires pg_cron extension to be enabled
-- To enable: Run this in Supabase SQL Editor:
-- SELECT cron.schedule(
--   'cleanup-expired-promotions',
--   '0 1 * * *', -- Run at 1 AM every day
--   $$SELECT cleanup_expired_promotions()$$
-- );

-- Alternative: Create a function to be called by Edge Functions or external cron
-- If you prefer using Supabase Edge Functions with cron triggers instead
CREATE OR REPLACE FUNCTION get_expired_promotions_count()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO expired_count
  FROM products
  WHERE is_on_sale = TRUE
    AND sale_ends_at IS NOT NULL
    AND sale_ends_at < NOW();
    
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_promotions() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_expired_promotions_count() TO authenticated, service_role;
