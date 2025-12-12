-- =============================================================================
-- Migration: Add RLS Policies for Addresses Table
-- Date: December 12, 2025
-- Description: Enable RLS and create policies for user addresses
-- =============================================================================

BEGIN;

-- Enable RLS on addresses table
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SELECT POLICIES (Who can read addresses?)
-- =============================================================================

-- Policy: Users can read their own addresses
CREATE POLICY "Users can read own addresses"
  ON public.addresses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- INSERT POLICIES (Who can create addresses?)
-- =============================================================================

-- Policy: Users can insert their own addresses
CREATE POLICY "Users can insert own addresses"
  ON public.addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- UPDATE POLICIES (Who can modify addresses?)
-- =============================================================================

-- Policy: Users can update their own addresses
CREATE POLICY "Users can update own addresses"
  ON public.addresses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- DELETE POLICIES (Who can delete addresses?)
-- =============================================================================

-- Policy: Users can delete their own addresses
CREATE POLICY "Users can delete own addresses"
  ON public.addresses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGER: Update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_address_updated ON public.addresses;
CREATE TRIGGER on_address_updated
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_addresses_updated_at();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'addresses';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'addresses';

COMMIT;
