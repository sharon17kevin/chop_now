-- =============================================================================
-- Supabase Database Setup: Auto-create Profile on Signup
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor
-- This ensures every new user automatically gets a profile row

-- 1. Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('customer', 'vendor', 'admin')) DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Helper Function: Get user role without causing recursion
-- This function runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- 4. RLS Policies

-- =============================================================================
-- SELECT POLICIES (Who can read profiles?)
-- =============================================================================

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Admins can read all profiles
-- Use case: Platform management, user support, analytics
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Vendors can read customer profiles (for order fulfillment)
-- Use case: When a customer places an order, vendor needs shipping info
CREATE POLICY "Vendors can read customer profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'customer' AND
    public.get_user_role(auth.uid()) = 'vendor'
  );

-- Policy: Customers can read vendor profiles (for transparency)
-- Use case: Buyers want to see farmer contact info, ratings, location
CREATE POLICY "Customers can read vendor profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'vendor' AND
    public.get_user_role(auth.uid()) = 'customer'
  );

-- =============================================================================
-- INSERT POLICIES (Who can create profiles?)
-- =============================================================================

-- Policy: Service role can insert (via Edge Function during signup)
CREATE POLICY "Service can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- UPDATE POLICIES (Who can modify profiles?)
-- =============================================================================

-- Policy: Users can update their own profile (except role)
-- Use case: Update name, phone, address, avatar
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Policy: Admins can update any profile (including role changes)
-- Use case: Approve vendor applications, handle disputes, grant admin access
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- =============================================================================
-- DELETE POLICIES (Who can delete profiles?)
-- =============================================================================

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Admins can delete any profile
-- Use case: Remove spam accounts, ban violators
CREATE POLICY "Admins can delete all profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 5. Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$;

-- 6. Trigger: Execute function after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Function: Update profile updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 8. Trigger: Auto-update updated_at on profile changes
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify everything is working:

-- 1. Check if profiles table exists
SELECT * FROM information_schema.tables WHERE table_name = 'profiles';

-- 2. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 3. Check triggers
SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%user%';

-- =============================================================================
-- OPTIONAL: Backfill existing users (if you have users without profiles)
-- =============================================================================
-- Uncomment and run if you have existing auth.users without profiles:

-- INSERT INTO public.profiles (id, email, name, role)
-- SELECT 
--   au.id,
--   au.email,
--   COALESCE(au.raw_user_meta_data->>'name', ''),
--   COALESCE(au.raw_user_meta_data->>'role', 'customer')
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON au.id = p.id
-- WHERE p.id IS NULL;
