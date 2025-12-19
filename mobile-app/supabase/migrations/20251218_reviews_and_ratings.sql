-- =============================================================================
-- Migration: Reviews and Ratings System
-- Date: December 18, 2025
-- Description: Comprehensive review system for vendors with automatic rating
-- calculations and helpful vote tracking
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. REVIEWS TABLE (Vendor Reviews)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reviewer information
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- What is being reviewed (vendor only for now)
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  
  -- Review metadata
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Optional: link to order
  images TEXT[] DEFAULT ARRAY[]::TEXT[], -- Optional review photos
  
  -- Engagement tracking
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  not_helpful_count INTEGER DEFAULT 0 CHECK (not_helpful_count >= 0),
  
  -- Verification
  verified_purchase BOOLEAN DEFAULT false, -- True if from actual order
  
  -- Moderation
  is_published BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  moderated_by UUID REFERENCES public.profiles(id),
  moderated_at TIMESTAMPTZ,
  
  -- Admin response
  vendor_response TEXT,
  vendor_response_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: User can only review vendor once per order (or once if no order)
  CONSTRAINT unique_review_per_vendor UNIQUE NULLS NOT DISTINCT (user_id, vendor_id, order_id)
);

-- Indexes for performance
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_vendor_id ON public.reviews(vendor_id);
CREATE INDEX idx_reviews_order_id ON public.reviews(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_is_published ON public.reviews(is_published);
CREATE INDEX idx_reviews_verified_purchase ON public.reviews(verified_purchase);

-- =============================================================================
-- 2. REVIEW_VOTES TABLE (Helpful voting)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL, -- true = helpful, false = not helpful
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One vote per user per review
  CONSTRAINT unique_vote_per_review UNIQUE (review_id, user_id)
);

CREATE INDEX idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON public.review_votes(user_id);

-- =============================================================================
-- 3. AUTO-UPDATE TRIGGERS
-- =============================================================================

-- Trigger: Update vendor rating when review is added/updated/deleted
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

  -- Calculate new average rating
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3, 2),
    COUNT(*)::INTEGER
  INTO avg_rating, review_count
  FROM public.reviews
  WHERE vendor_id = target_vendor_id AND is_published = true;
  
  -- Update vendor profile
  UPDATE public.profiles
  SET 
    rating = avg_rating,
    updated_at = NOW()
  WHERE id = target_vendor_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to reviews table
DROP TRIGGER IF EXISTS update_vendor_rating_trigger ON public.reviews;
CREATE TRIGGER update_vendor_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_vendor_rating();

-- Trigger: Update helpful counts when votes change
CREATE OR REPLACE FUNCTION public.update_review_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment helpful or not_helpful count
    IF NEW.is_helpful THEN
      UPDATE public.reviews 
      SET helpful_count = helpful_count + 1 
      WHERE id = NEW.review_id;
    ELSE
      UPDATE public.reviews 
      SET not_helpful_count = not_helpful_count + 1 
      WHERE id = NEW.review_id;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' AND OLD.is_helpful != NEW.is_helpful THEN
    -- User changed their vote
    IF NEW.is_helpful THEN
      UPDATE public.reviews 
      SET 
        helpful_count = helpful_count + 1,
        not_helpful_count = GREATEST(not_helpful_count - 1, 0)
      WHERE id = NEW.review_id;
    ELSE
      UPDATE public.reviews 
      SET 
        helpful_count = GREATEST(helpful_count - 1, 0),
        not_helpful_count = not_helpful_count + 1
      WHERE id = NEW.review_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count
    IF OLD.is_helpful THEN
      UPDATE public.reviews 
      SET helpful_count = GREATEST(helpful_count - 1, 0)
      WHERE id = OLD.review_id;
    ELSE
      UPDATE public.reviews 
      SET not_helpful_count = GREATEST(not_helpful_count - 1, 0)
      WHERE id = OLD.review_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_review_votes_count_trigger ON public.review_votes;
CREATE TRIGGER update_review_votes_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
FOR EACH ROW EXECUTE FUNCTION public.update_review_votes_count();

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 4. HELPER FUNCTIONS
-- =============================================================================

-- Function: Get rating breakdown for vendor
CREATE OR REPLACE FUNCTION public.get_rating_breakdown(
  target_id UUID,
  target_type TEXT -- 'vendor' for now (can extend to 'product' later)
)
RETURNS TABLE (
  rating INTEGER,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.rating,
    COUNT(*)::BIGINT as count
  FROM public.reviews r
  WHERE r.vendor_id = target_id AND r.is_published = true
  GROUP BY r.rating
  ORDER BY r.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if user can review (must have completed order)
CREATE OR REPLACE FUNCTION public.can_user_review_vendor(
  p_user_id UUID,
  p_vendor_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  has_completed_order BOOLEAN;
  already_reviewed BOOLEAN;
BEGIN
  -- Check if user has already reviewed this vendor
  SELECT EXISTS (
    SELECT 1 FROM public.reviews
    WHERE user_id = p_user_id
    AND vendor_id = p_vendor_id
  ) INTO already_reviewed;
  
  IF already_reviewed THEN
    RETURN false;
  END IF;
  
  -- Check if user has completed order with this vendor
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE user_id = p_user_id
    AND vendor_id = p_vendor_id
    AND status = 'delivered'
  ) INTO has_completed_order;
  
  RETURN has_completed_order;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- REVIEWS: Anyone can read published reviews
CREATE POLICY "Anyone can read published reviews"
  ON public.reviews FOR SELECT
  USING (is_published = true);

-- REVIEWS: Users can read their own reviews (even unpublished)
CREATE POLICY "Users can read own reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- REVIEWS: Users can insert reviews if they have completed order
CREATE POLICY "Users can insert reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    public.can_user_review_vendor(auth.uid(), vendor_id)
  );

-- REVIEWS: Users can update their own reviews (within 30 days)
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    created_at > NOW() - INTERVAL '30 days'
  )
  WITH CHECK (auth.uid() = user_id);

-- REVIEWS: Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- REVIEWS: Admins can do everything
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- REVIEW_VOTES: Users can read all votes
CREATE POLICY "Users can read review votes"
  ON public.review_votes FOR SELECT
  TO authenticated
  USING (true);

-- REVIEW_VOTES: Users can insert their own votes
CREATE POLICY "Users can insert review votes"
  ON public.review_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- REVIEW_VOTES: Users can update their own votes
CREATE POLICY "Users can update own review votes"
  ON public.review_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- REVIEW_VOTES: Users can delete their own votes
CREATE POLICY "Users can delete own review votes"
  ON public.review_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
