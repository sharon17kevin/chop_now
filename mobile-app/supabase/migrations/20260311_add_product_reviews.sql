-- =============================================================================
-- Migration: Add Product Review Support to Reviews Table
-- Date: March 11, 2026
-- Description: Extend reviews table to support both vendor and product reviews
-- Add product_id column and update triggers for product rating aggregation
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. ADD PRODUCT_ID COLUMN TO REVIEWS TABLE
-- =============================================================================

-- Add product_id column (nullable - NULL means vendor review, non-NULL means product review)
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;

-- Create index for product reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id) WHERE product_id IS NOT NULL;

-- Update unique constraint to support product-specific reviews
-- Drop existing constraint first
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS unique_review_per_vendor;

-- Add new constraint allowing one review per user per product OR one review per user per vendor (if no product)
ALTER TABLE public.reviews 
ADD CONSTRAINT unique_review_per_entity 
UNIQUE NULLS NOT DISTINCT (user_id, vendor_id, product_id, order_id);

-- =============================================================================
-- 2. PRODUCT RATING AGGREGATION TRIGGERS
-- =============================================================================

-- Trigger: Update product rating when product review is added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
  avg_rating NUMERIC(3, 2);
  review_count INTEGER;
BEGIN
  -- Determine product_id (use OLD for DELETE, NEW for INSERT/UPDATE)
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  -- Only process if this is a product review (product_id is not NULL)
  IF target_product_id IS NOT NULL THEN
    -- Calculate new average rating for this product
    SELECT 
      COALESCE(AVG(rating), 0)::NUMERIC(3, 2),
      COUNT(*)::INTEGER
    INTO avg_rating, review_count
    FROM public.reviews
    WHERE product_id = target_product_id AND is_published = true;
    
    -- Update product rating and review count
    UPDATE public.products
    SET 
      rating = avg_rating,
      review_count = review_count,
      updated_at = NOW()
    WHERE id = target_product_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply product rating trigger
DROP TRIGGER IF EXISTS update_product_rating_trigger ON public.reviews;
CREATE TRIGGER update_product_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- =============================================================================
-- 3. ENHANCED VENDOR RATING AGGREGATION (includes product reviews)
-- =============================================================================

-- Update existing vendor rating function to also include product reviews from their products
CREATE OR REPLACE FUNCTION public.update_vendor_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_vendor_id UUID;
  avg_rating NUMERIC(3, 2);
  review_count INTEGER;
BEGIN
  -- Determine vendor_id (use OLD for DELETE, NEW for INSERT/UPDATE)
  IF TG_OP = 'DELETE' THEN
    target_vendor_id := OLD.vendor_id;
  ELSE
    target_vendor_id := NEW.vendor_id;
  END IF;

  -- Calculate new average rating from ALL reviews related to this vendor
  -- This includes: direct vendor reviews + reviews on their products
  WITH vendor_reviews AS (
    -- Direct vendor reviews (product_id IS NULL)
    SELECT rating FROM public.reviews 
    WHERE vendor_id = target_vendor_id 
      AND product_id IS NULL 
      AND is_published = true
    
    UNION ALL
    
    -- Product reviews for products owned by this vendor
    SELECT r.rating FROM public.reviews r
    INNER JOIN public.products p ON r.product_id = p.id
    WHERE p.vendor_id = target_vendor_id 
      AND r.is_published = true
  )
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3, 2),
    COUNT(*)::INTEGER
  INTO avg_rating, review_count
  FROM vendor_reviews;
  
  -- Update vendor profile rating
  UPDATE public.profiles
  SET 
    rating = avg_rating,
    updated_at = NOW()
  WHERE id = target_vendor_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- The existing vendor rating trigger will automatically use the updated function

-- =============================================================================
-- 4. RLS POLICIES FOR PRODUCT REVIEWS
-- =============================================================================

-- Product reviews inherit the same RLS policies as vendor reviews
-- No additional policies needed since existing policies on reviews table 
-- already handle the product_id column appropriately

-- =============================================================================
-- 5. HELPER FUNCTIONS
-- =============================================================================

-- Function to get product rating summary
CREATE OR REPLACE FUNCTION public.get_product_rating_summary(p_product_id UUID)
RETURNS TABLE (
  average_rating NUMERIC(3,2),
  total_reviews INTEGER,
  rating_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH rating_stats AS (
    SELECT 
      COALESCE(AVG(rating), 0)::NUMERIC(3,2) as avg_rating,
      COUNT(*)::INTEGER as total_count
    FROM public.reviews 
    WHERE product_id = p_product_id AND is_published = true
  ),
  rating_counts AS (
    SELECT 
      rating,
      COUNT(*) as count
    FROM public.reviews 
    WHERE product_id = p_product_id AND is_published = true
    GROUP BY rating
  )
  SELECT 
    rs.avg_rating,
    rs.total_count,
    COALESCE(
      jsonb_object_agg(rc.rating::text, rc.count),
      '{}'::jsonb
    ) as breakdown
  FROM rating_stats rs
  LEFT JOIN rating_counts rc ON true
  GROUP BY rs.avg_rating, rs.total_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;