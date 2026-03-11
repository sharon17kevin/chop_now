-- Fix profiles RLS policies to allow public access to vendor information
-- This ensures customers can view vendor profiles for the marketplace

-- Drop existing public profile policy if it exists
DROP POLICY IF EXISTS "Public can view limited profile info" ON profiles;
DROP POLICY IF EXISTS "Anyone can view vendor profiles" ON profiles;

-- Create a new policy specifically for viewing vendor profiles
-- This allows any authenticated user to view vendor profile information
CREATE POLICY "Anyone can view vendor profiles"
  ON profiles
  FOR SELECT
  USING (role = 'vendor');

-- Also ensure regular users can still view their own full profile
-- (This policy should already exist, but we'll recreate it to be sure)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" 
  ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow users to insert their own profile during signup
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Verify policies are working
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

COMMENT ON TABLE profiles IS 'User profiles with RLS - users manage own profile, anyone can view vendor profiles';