-- Add simple push notifications toggle to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_push_enabled 
ON public.profiles(push_notifications_enabled) 
WHERE push_notifications_enabled = true;

-- Update existing users to have push notifications enabled by default
UPDATE public.profiles 
SET push_notifications_enabled = true 
WHERE push_notifications_enabled IS NULL;

COMMENT ON COLUMN public.profiles.push_notifications_enabled IS 'Master toggle for all push notifications';
