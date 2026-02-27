-- Enable Row Level Security on promo_codes table
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on promo_code_usage table
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROMO_CODES POLICIES
-- =====================================================

-- Anyone can view active promo codes (for applying during checkout)
CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes
  FOR SELECT
  USING (
    is_active = true 
    AND (valid_until IS NULL OR valid_until > NOW())
    AND (usage_limit IS NULL OR usage_count < usage_limit)
  );

-- Vendors can view their own promo codes (including inactive ones)
CREATE POLICY "Vendors can view their own promo codes"
  ON promo_codes
  FOR SELECT
  USING (vendor_id = auth.uid());

-- Platform can view all promo codes (where vendor_id is null = platform-wide codes)
CREATE POLICY "Anyone can view platform promo codes"
  ON promo_codes
  FOR SELECT
  USING (vendor_id IS NULL);

-- Vendors can create their own promo codes
CREATE POLICY "Vendors can create their own promo codes"
  ON promo_codes
  FOR INSERT
  WITH CHECK (vendor_id = auth.uid());

-- Vendors can update their own promo codes
CREATE POLICY "Vendors can update their own promo codes"
  ON promo_codes
  FOR UPDATE
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- Vendors can delete their own promo codes
CREATE POLICY "Vendors can delete their own promo codes"
  ON promo_codes
  FOR DELETE
  USING (vendor_id = auth.uid());

-- =====================================================
-- PROMO_CODE_USAGE POLICIES
-- =====================================================

-- Users can view their own promo code usage history
CREATE POLICY "Users can view their own promo usage"
  ON promo_code_usage
  FOR SELECT
  USING (user_id = auth.uid());

-- Vendors can view usage of their promo codes
CREATE POLICY "Vendors can view their promo code usage"
  ON promo_code_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM promo_codes
      WHERE promo_codes.id = promo_code_usage.promo_code_id
      AND promo_codes.vendor_id = auth.uid()
    )
  );

-- Authenticated users can insert promo code usage (when applying codes)
CREATE POLICY "Users can record promo usage"
  ON promo_code_usage
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own complete profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Public can view limited profile information (for marketplace, reviews, etc.)
CREATE POLICY "Public can view limited profile info"
  ON profiles
  FOR SELECT
  USING (true);

-- Note: If you want to restrict which fields are publicly visible, you'd need to:
-- 1. Create a view with only public fields
-- 2. Grant access to the view instead
-- Or handle this in your application logic

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (typically done via auth trigger)
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- =====================================================
-- COMMENTS AND NOTES
-- =====================================================

-- SECURITY CONSIDERATIONS:
-- 1. Profiles: Currently allows public read of all profile data
--    - Consider creating a public_profiles view with only non-sensitive fields:
--      * full_name, avatar_url, bio, location, etc.
--    - Hide sensitive fields like: phone, email, bank details, addresses
--
-- 2. Promo Codes: Platform-wide codes (vendor_id IS NULL) require admin management
--    - Consider adding an is_admin column to profiles
--    - Or use Supabase custom claims/roles for admin access
--
-- 3. Promo Code Usage: Currently allows any authenticated user to insert
--    - This is fine if your application logic validates the promo code
--    - Consider adding a policy to prevent duplicate usage per user/order

-- FUTURE ENHANCEMENTS:
-- Add admin role support:
-- CREATE POLICY "Admins can manage all promo codes"
--   ON promo_codes
--   FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.role = 'admin'
--     )
--   );

COMMENT ON TABLE promo_codes IS 'Promo codes with RLS enabled - vendors can manage their own codes';
COMMENT ON TABLE promo_code_usage IS 'Promo code usage tracking with RLS - users can view their own history';
COMMENT ON TABLE profiles IS 'User profiles with RLS enabled - users can manage their own profile, public can view limited info';
