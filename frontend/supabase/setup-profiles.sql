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

-- 3. RLS Policies

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
  );

-- Only service role can insert (via trigger)
CREATE POLICY "Service can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Function: Auto-create profile on user signup
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

-- 5. Trigger: Execute function after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Function: Update profile updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 7. Trigger: Auto-update updated_at on profile changes
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
