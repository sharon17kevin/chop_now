-- =============================================================================
-- Migration: Add Essential Profile Fields
-- Date: November 14, 2025
-- Description: Add missing profile fields and rename 'name' to 'full_name'
-- =============================================================================

-- Phase 1: Add Basic Profile Fields
-- Fix naming inconsistency and add essential fields for customer profiles

BEGIN;

-- 1. Rename 'name' to 'full_name' for consistency
ALTER TABLE public.profiles 
  RENAME COLUMN name TO full_name;

-- 2. Add basic contact and profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS profile_image TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 3. Add location fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Nigeria',
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6);

-- 4. Add vendor-specific fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS farm_name TEXT,
  ADD COLUMN IF NOT EXISTS farm_location TEXT,
  ADD COLUMN IF NOT EXISTS farm_description TEXT,
  ADD COLUMN IF NOT EXISTS business_phone TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS delivery_zones TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 5. Add engagement and statistics fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0 CHECK (total_orders >= 0),
  ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0 CHECK (total_sales >= 0),
  ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0 CHECK (favorite_count >= 0),
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"push": true, "email": true, "sms": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- 6. Add social media links
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb;

-- 7. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(verified) WHERE role = 'vendor';
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating) WHERE role = 'vendor';
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- 8. Update the handle_new_user function to use 'full_name'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$;

-- 9. Add comment for documentation
COMMENT ON COLUMN public.profiles.full_name IS 'User full name (formerly "name")';
COMMENT ON COLUMN public.profiles.verified IS 'Vendor verification status - true if business is verified by admin';
COMMENT ON COLUMN public.profiles.farm_name IS 'Business/farm name for vendors only';
COMMENT ON COLUMN public.profiles.rating IS 'Average rating from customer reviews (0.00 to 5.00)';
COMMENT ON COLUMN public.profiles.delivery_zones IS 'Array of cities/regions where vendor delivers';

COMMIT;

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Check new columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles' AND schemaname = 'public';

-- =============================================================================
-- Rollback Script (if needed)
-- =============================================================================
-- UNCOMMENT TO ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_profiles_role;
-- DROP INDEX IF EXISTS idx_profiles_verified;
-- DROP INDEX IF EXISTS idx_profiles_city;
-- DROP INDEX IF EXISTS idx_profiles_state;
-- DROP INDEX IF EXISTS idx_profiles_rating;
-- DROP INDEX IF EXISTS idx_profiles_is_active;
-- 
-- ALTER TABLE public.profiles
--   DROP COLUMN IF EXISTS social_media,
--   DROP COLUMN IF EXISTS last_login,
--   DROP COLUMN IF EXISTS is_active,
--   DROP COLUMN IF EXISTS notification_preferences,
--   DROP COLUMN IF EXISTS favorite_count,
--   DROP COLUMN IF EXISTS total_sales,
--   DROP COLUMN IF EXISTS total_orders,
--   DROP COLUMN IF EXISTS rating,
--   DROP COLUMN IF EXISTS delivery_zones,
--   DROP COLUMN IF EXISTS business_hours,
--   DROP COLUMN IF EXISTS verified,
--   DROP COLUMN IF EXISTS business_phone,
--   DROP COLUMN IF EXISTS farm_description,
--   DROP COLUMN IF EXISTS farm_location,
--   DROP COLUMN IF EXISTS farm_name,
--   DROP COLUMN IF EXISTS longitude,
--   DROP COLUMN IF EXISTS latitude,
--   DROP COLUMN IF EXISTS postal_code,
--   DROP COLUMN IF EXISTS country,
--   DROP COLUMN IF EXISTS state,
--   DROP COLUMN IF EXISTS city,
--   DROP COLUMN IF EXISTS date_of_birth,
--   DROP COLUMN IF EXISTS bio,
--   DROP COLUMN IF EXISTS profile_image,
--   DROP COLUMN IF EXISTS address,
--   DROP COLUMN IF EXISTS phone;
-- 
-- ALTER TABLE public.profiles
--   RENAME COLUMN full_name TO name;
-- COMMIT;
