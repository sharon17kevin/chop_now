-- OPTIONAL: Create a public_profiles view to limit publicly accessible profile fields
-- This is a more secure alternative to allowing full profile access

-- Only run this if you want to restrict public access to specific profile fields
-- If you run this, you should update your application queries to use public_profiles
-- instead of profiles when displaying vendor/user information to others

-- =====================================================
-- CREATE PUBLIC PROFILES VIEW
-- =====================================================

-- Drop the existing public read policy on profiles
DROP POLICY IF EXISTS "Public can view limited profile info" ON profiles;

-- Create a view with only publicly safe fields
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  full_name,
  profile_image,
  banner_image,
  role,
  verified,
  farm_name,
  farm_location,
  farm_description,
  created_at,
  updated_at
FROM profiles;

-- Grant access to the view
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- Add comment
COMMENT ON VIEW public_profiles IS 'Public view of profiles with only non-sensitive fields exposed';

-- =====================================================
-- UPDATE APPLICATION QUERIES
-- =====================================================

-- After enabling this view, update your application code:
-- 
-- BEFORE:
-- const { data } = await supabase
--   .from('profiles')
--   .select('full_name, profile_image')
--   .eq('id', vendorId)
--
-- AFTER:
-- const { data } = await supabase
--   .from('public_profiles')
--   .select('full_name, profile_image')
--   .eq('id', vendorId)
-- 
-- For user's own profile, continue using 'profiles' table directly
-- as the "Users can view their own profile" policy allows full access

-- =====================================================
-- FIELDS BREAKDOWN
-- =====================================================

-- EXPOSED IN public_profiles:
--   ✅ id, full_name, profile_image, banner_image
--   ✅ role, verified
--   ✅ farm_name, farm_location, farm_description
--   ✅ created_at, updated_at
--
-- HIDDEN (only accessible to profile owner):
--   🔒 phone, email, address
--   🔒 business_phone
--   🔒 selected_address_id
--   🔒 bank_account_number, bank_code, bank_name, account_name
--   🔒 paystack_recipient_code
--   🔒 payout_enabled, payout_schedule, minimum_payout_amount
--   🔒 bank_account_verified, bank_account_verified_at
--   🔒 Any other sensitive financial or personal data
