-- =============================================================================
-- Migration: Add Banner Image Support
-- Date: December 18, 2025
-- Description: Add banner_image field for vendor profile banners/cover photos
-- =============================================================================

BEGIN;

-- Add banner_image field to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.banner_image IS 'URL to vendor banner/cover image (Supabase Storage path or external URL)';
COMMENT ON COLUMN public.profiles.profile_image IS 'URL to user profile picture (Supabase Storage path or external URL)';

-- Create index for better query performance on profiles with banners
CREATE INDEX IF NOT EXISTS idx_profiles_banner_image 
  ON public.profiles(banner_image) 
  WHERE banner_image IS NOT NULL;

COMMIT;

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Check both image columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public' 
  AND column_name IN ('profile_image', 'banner_image')
ORDER BY column_name;

-- Check index created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles' 
  AND schemaname = 'public'
  AND indexname = 'idx_profiles_banner_image';

-- =============================================================================
-- Usage Notes
-- =============================================================================
-- Both profile_image and banner_image can store:
-- 1. Supabase Storage paths (e.g., 'avatars/user-id/profile.jpg')
-- 2. Supabase Storage public URLs (e.g., 'https://...supabase.co/storage/v1/object/public/...')
-- 3. External URLs (e.g., 'https://example.com/image.jpg')
--
-- Recommended Storage Bucket Structure:
-- - Bucket: 'avatars' (for profile pictures)
-- - Bucket: 'banners' (for banner images)
-- - Path pattern: {bucket}/{user_id}/{filename}
-- =============================================================================
