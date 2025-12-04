-- =============================================================================
-- Migration: Vendor Application Review System
-- Date: December 2, 2025
-- Description: Creates vendor_applications table for admin review queue,
-- approval/rejection functions, and notification system
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. VENDOR_APPLICATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Application Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  
  -- Business Information (from form)
  farm_name TEXT NOT NULL,
  farm_location TEXT,
  farm_description TEXT NOT NULL,
  business_phone TEXT NOT NULL,
  
  -- Address Information
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  
  -- Delivery & Hours
  delivery_zones TEXT[] DEFAULT ARRAY[]::TEXT[],
  business_hours JSONB DEFAULT '{}'::jsonb,
  
  -- Review Information
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Only one pending application per user at a time
  UNIQUE(user_id, status)
);

-- Indexes for performance
CREATE INDEX idx_vendor_applications_user_id ON public.vendor_applications(user_id);
CREATE INDEX idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX idx_vendor_applications_created_at ON public.vendor_applications(created_at DESC);
CREATE INDEX idx_vendor_applications_reviewed_by ON public.vendor_applications(reviewed_by);

-- =============================================================================
-- 2. RLS POLICIES
-- =============================================================================

ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- Users can read their own applications
CREATE POLICY "Users can read own applications"
  ON public.vendor_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own applications (only if no pending application exists)
CREATE POLICY "Users can insert own applications"
  ON public.vendor_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM public.vendor_applications
      WHERE user_id = auth.uid() AND status = 'pending'
    )
  );

-- Admins can read all applications
CREATE POLICY "Admins can read all applications"
  ON public.vendor_applications FOR SELECT
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Admins can update applications (for approval/rejection)
CREATE POLICY "Admins can update applications"
  ON public.vendor_applications FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- =============================================================================
-- 3. APPROVAL FUNCTION (Atomically updates profile and application)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.approve_vendor_application(
  application_id UUID,
  admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_record RECORD;
  result JSON;
BEGIN
  -- Verify admin role
  IF public.get_user_role(admin_id) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can approve applications';
  END IF;

  -- Get application details
  SELECT * INTO app_record
  FROM public.vendor_applications
  WHERE id = application_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or already processed';
  END IF;

  -- Update profile to vendor with all business details
  UPDATE public.profiles SET
    role = 'vendor',
    farm_name = app_record.farm_name,
    farm_location = app_record.farm_location,
    farm_description = app_record.farm_description,
    business_phone = app_record.business_phone,
    address = app_record.address,
    city = app_record.city,
    state = app_record.state,
    postal_code = app_record.postal_code,
    delivery_zones = app_record.delivery_zones,
    business_hours = app_record.business_hours,
    verified = true, -- Mark as verified vendor
    updated_at = NOW()
  WHERE id = app_record.user_id;

  -- Update application status
  UPDATE public.vendor_applications SET
    status = 'approved',
    reviewed_by = admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = application_id;

  -- Create notification for user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    app_record.user_id,
    'Vendor Application Approved! 🎉',
    'Congratulations! Your vendor application has been approved. You can now start listing products.',
    'system'
  );

  -- Return success result
  result := json_build_object(
    'success', true,
    'application_id', application_id,
    'user_id', app_record.user_id,
    'farm_name', app_record.farm_name
  );

  RETURN result;
END;
$$;

-- =============================================================================
-- 4. REJECTION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.reject_vendor_application(
  application_id UUID,
  admin_id UUID,
  rejection_reason TEXT,
  admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_record RECORD;
  result JSON;
BEGIN
  -- Verify admin role
  IF public.get_user_role(admin_id) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can reject applications';
  END IF;

  -- Get application details
  SELECT * INTO app_record
  FROM public.vendor_applications
  WHERE id = application_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or already processed';
  END IF;

  -- Update application status
  UPDATE public.vendor_applications SET
    status = 'rejected',
    reviewed_by = admin_id,
    reviewed_at = NOW(),
    rejection_reason = rejection_reason,
    admin_notes = admin_notes,
    updated_at = NOW()
  WHERE id = application_id;

  -- Create notification for user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    app_record.user_id,
    'Vendor Application Update',
    'Your vendor application requires attention. Reason: ' || rejection_reason,
    'alert'
  );

  -- Return success result
  result := json_build_object(
    'success', true,
    'application_id', application_id,
    'user_id', app_record.user_id,
    'rejection_reason', rejection_reason
  );

  RETURN result;
END;
$$;

-- =============================================================================
-- 5. TRIGGER: Notify admins when new application is submitted
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_admins_new_vendor_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  applicant_name TEXT;
BEGIN
  -- Get applicant name
  SELECT full_name INTO applicant_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Create notification for all admins
  FOR admin_record IN 
    SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      admin_record.id,
      'New Vendor Application',
      applicant_name || ' (' || NEW.farm_name || ') has submitted a vendor application for review.',
      'system',
      '/admin/vendor-review/' || NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vendor_application_notify_admins ON public.vendor_applications;
CREATE TRIGGER vendor_application_notify_admins
AFTER INSERT ON public.vendor_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_vendor_application();

-- =============================================================================
-- 6. HELPER FUNCTION: Check if user has pending application
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_pending_vendor_application(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_applications
    WHERE vendor_applications.user_id = $1 AND status = 'pending'
  );
$$;

-- =============================================================================
-- 7. UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_vendor_application_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vendor_application_updated_at ON public.vendor_applications;
CREATE TRIGGER vendor_application_updated_at
BEFORE UPDATE ON public.vendor_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_vendor_application_timestamp();

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check table created
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'vendor_applications'
) AS vendor_applications_exists;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'vendor_applications';

-- Check functions created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'approve_vendor_application',
  'reject_vendor_application',
  'notify_admins_new_vendor_application',
  'has_pending_vendor_application'
)
ORDER BY routine_name;
