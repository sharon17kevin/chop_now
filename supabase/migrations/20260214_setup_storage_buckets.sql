-- =============================================================================
-- Migration: Setup Storage Buckets and Policies
-- Date: February 14, 2026
-- Description: Create storage buckets for avatars, banners, and product images
--              with proper public access policies
-- =============================================================================

BEGIN;

-- =============================================================================
-- Create Storage Buckets
-- =============================================================================

-- Create avatars bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Create banners bucket for vendor cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,  -- Public bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,  -- Public bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- =============================================================================
-- Storage Policies for Avatars
-- =============================================================================

-- Allow public to view all avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================================================
-- Storage Policies for Banners
-- =============================================================================

-- Allow public to view all banners
CREATE POLICY "Public can view banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Allow authenticated users to upload their own banners
CREATE POLICY "Users can upload their own banner"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own banners
CREATE POLICY "Users can update their own banner"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own banners
CREATE POLICY "Users can delete their own banner"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================================================
-- Storage Policies for Product Images
-- =============================================================================

-- Allow public to view all product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow vendors to upload product images
CREATE POLICY "Vendors can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'vendor'
  )
);

-- Allow vendors to update their own product images
CREATE POLICY "Vendors can update their own product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'vendor'
  )
)
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'vendor'
  )
);

-- Allow vendors to delete their own product images
CREATE POLICY "Vendors can delete their own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'vendor'
  )
);

COMMIT;

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Check buckets created
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('avatars', 'banners', 'product-images')
ORDER BY id;

-- Check policies created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%avatar%' 
  OR policyname LIKE '%banner%'
  OR policyname LIKE '%product%'
ORDER BY policyname;

-- =============================================================================
-- Usage Notes
-- =============================================================================
-- Bucket Structure:
-- - avatars: User profile pictures (5MB limit, public read)
-- - banners: Vendor banner/cover images (10MB limit, public read)
-- - product-images: Product photos (10MB limit, public read, vendor-only write)
--
-- Path Pattern: {bucket}/{user_id}/{filename}
-- Example: avatars/550e8400-e29b-41d4-a716-446655440000/profile.jpg
--
-- Policies:
-- - Public can view all images in all buckets
-- - Users can only upload/update/delete their own avatars and banners
-- - Only vendors can upload/update/delete product images
-- =============================================================================
