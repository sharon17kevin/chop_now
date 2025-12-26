-- Add push notification support to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "new_orders": true,
  "order_updates": true,
  "reviews": true,
  "promotions": true,
  "messages": true
}'::jsonb;

-- Add notification tracking to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS vendor_notified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vendor_notified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS customer_notified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_notified_at TIMESTAMPTZ;

-- Create index for faster push token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON public.profiles(expo_push_token) WHERE expo_push_token IS NOT NULL;

-- Create function to get vendor push tokens
CREATE OR REPLACE FUNCTION get_vendor_push_tokens(vendor_ids UUID[])
RETURNS TABLE (
  vendor_id UUID,
  push_token TEXT,
  full_name TEXT,
  farm_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.expo_push_token,
    p.full_name,
    p.farm_name
  FROM profiles p
  WHERE p.id = ANY(vendor_ids)
    AND p.expo_push_token IS NOT NULL
    AND (p.notification_preferences->>'new_orders')::boolean = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;