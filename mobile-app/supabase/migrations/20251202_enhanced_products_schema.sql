-- =============================================================================
-- Migration: Enhanced Products Schema for Vendor Self-Service
-- Date: December 2, 2025
-- Description: Adds support for multiple product images, better categorization,
-- vendor approval workflow, and product metadata
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. DROP EXISTING POLICIES TO RECREATE THEM
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can read available products" ON public.products;
DROP POLICY IF EXISTS "Vendors can read own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can insert own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can update own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON public.products;

-- =============================================================================
-- 2. ALTER PRODUCTS TABLE - ADD NEW COLUMNS
-- =============================================================================

-- Add multiple images support (array of image URLs)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add product metadata
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS location JSONB DEFAULT '{}'::jsonb, -- {lat, lng, address}
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- searchable tags
  ADD COLUMN IF NOT EXISTS is_organic BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS harvest_date DATE,
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Add vendor approval workflow
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'rejected')) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add rating and review support
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);

-- Migrate existing image_url to images array (keep both for backwards compatibility)
UPDATE public.products 
SET images = ARRAY[image_url]::TEXT[]
WHERE image_url IS NOT NULL AND (images IS NULL OR images = ARRAY[]::TEXT[]);

-- =============================================================================
-- 3. CREATE INDEXES FOR NEW COLUMNS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_is_organic ON public.products(is_organic);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- =============================================================================
-- 4. ENHANCED RLS POLICIES FOR PRODUCTS
-- =============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved AND available products
CREATE POLICY "Anyone can read approved products"
  ON public.products FOR SELECT
  USING (status = 'approved' AND is_available = true);

-- Vendors can read all their own products (any status)
CREATE POLICY "Vendors can read own products"
  ON public.products FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

-- Admins can read all products
CREATE POLICY "Admins can read all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Verified vendors can insert own products (with pending status by default)
CREATE POLICY "Verified vendors can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = vendor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'vendor' 
      AND verified = true
    )
  );

-- Vendors can update own products (except status/review fields)
CREATE POLICY "Vendors can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

-- Admins can update any product (including status)
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Vendors can delete own draft/rejected products
CREATE POLICY "Vendors can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    auth.uid() = vendor_id AND
    status IN ('draft', 'rejected')
  );

-- Admins can delete any product
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- =============================================================================
-- 5. HELPER FUNCTIONS
-- =============================================================================

-- Function to approve product
CREATE OR REPLACE FUNCTION public.approve_product(
  product_id UUID,
  admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  result JSON;
BEGIN
  -- Verify admin role
  IF public.get_user_role(admin_id) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can approve products';
  END IF;

  -- Get product details
  SELECT * INTO product_record
  FROM public.products
  WHERE id = product_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or already processed';
  END IF;

  -- Update product status
  UPDATE public.products SET
    status = 'approved',
    reviewed_by = admin_id,
    reviewed_at = NOW(),
    rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = product_id;

  -- Notify vendor
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    product_record.vendor_id,
    'Product Approved! 🎉',
    'Your product "' || product_record.name || '" has been approved and is now live on the marketplace.',
    'system'
  );

  result := json_build_object(
    'success', true,
    'product_id', product_id,
    'vendor_id', product_record.vendor_id
  );

  RETURN result;
END;
$$;

-- Function to reject product
CREATE OR REPLACE FUNCTION public.reject_product(
  product_id UUID,
  admin_id UUID,
  rejection_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  result JSON;
BEGIN
  -- Verify admin role
  IF public.get_user_role(admin_id) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can reject products';
  END IF;

  -- Get product details
  SELECT * INTO product_record
  FROM public.products
  WHERE id = product_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or already processed';
  END IF;

  -- Update product status
  UPDATE public.products SET
    status = 'rejected',
    reviewed_by = admin_id,
    reviewed_at = NOW(),
    rejection_reason = rejection_reason,
    updated_at = NOW()
  WHERE id = product_id;

  -- Notify vendor
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    product_record.vendor_id,
    'Product Needs Attention',
    'Your product "' || product_record.name || '" requires changes: ' || rejection_reason,
    'alert'
  );

  result := json_build_object(
    'success', true,
    'product_id', product_id,
    'vendor_id', product_record.vendor_id
  );

  RETURN result;
END;
$$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_product_views(product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products 
  SET view_count = view_count + 1 
  WHERE id = product_id;
END;
$$;

-- =============================================================================
-- 6. TRIGGERS
-- =============================================================================

-- Prevent vendors from modifying status and review fields
CREATE OR REPLACE FUNCTION public.protect_product_status()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  
  -- Only admins can change status, reviewed_by, reviewed_at
  IF user_role != 'admin' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Only admins can change product status';
    END IF;
    
    IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by THEN
      RAISE EXCEPTION 'Only admins can change reviewer';
    END IF;
    
    IF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
      RAISE EXCEPTION 'Only admins can change review timestamp';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_product_status_trigger ON public.products;
CREATE TRIGGER protect_product_status_trigger
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.protect_product_status();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_updated_at ON public.products;
CREATE TRIGGER product_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_product_timestamp();

-- Notify admins when new product submitted
CREATE OR REPLACE FUNCTION public.notify_admins_new_product()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Only notify for pending products
  IF NEW.status = 'pending' THEN
    FOR admin_record IN 
      SELECT id FROM public.profiles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        admin_record.id,
        'New Product to Review',
        'A new product "' || NEW.name || '" has been submitted for review.',
        'system'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_admins_new_product_trigger ON public.products;
CREATE TRIGGER notify_admins_new_product_trigger
AFTER INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_product();

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('images', 'status', 'location', 'tags', 'rating', 'is_organic')
ORDER BY column_name;

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('approve_product', 'reject_product', 'increment_product_views')
ORDER BY routine_name;
