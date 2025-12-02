-- =============================================================================
-- Test Data for Vendor Applications
-- Run this SQL in Supabase to create test vendor applications
-- =============================================================================

-- First, ensure you have a test user (replace with your actual user ID)
-- Get your user ID: SELECT id, email FROM profiles WHERE email = 'your@email.com';

-- Insert a test vendor application
-- Replace 'YOUR_USER_ID_HERE' with actual user ID
INSERT INTO public.vendor_applications (
  user_id,
  farm_name,
  farm_location,
  farm_description,
  business_phone,
  address,
  city,
  state,
  postal_code,
  delivery_zones,
  business_hours,
  status
) VALUES (
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  'Fresh Farms Nigeria',
  'Km 15 Lagos-Ibadan Expressway',
  'We supply fresh organic vegetables, fruits, and dairy products directly from our farm. Quality guaranteed with same-day delivery.',
  '+234 802 123 4567',
  '123 Farm Road, Berger',
  'Lagos',
  'Lagos State',
  '100001',
  ARRAY['Lagos', 'Ikeja', 'Victoria Island', 'Lekki'],
  '{
    "monday": {"open": "07:00", "close": "19:00", "closed": false},
    "tuesday": {"open": "07:00", "close": "19:00", "closed": false},
    "wednesday": {"open": "07:00", "close": "19:00", "closed": false},
    "thursday": {"open": "07:00", "close": "19:00", "closed": false},
    "friday": {"open": "07:00", "close": "19:00", "closed": false},
    "saturday": {"open": "08:00", "close": "18:00", "closed": false},
    "sunday": {"open": "09:00", "close": "15:00", "closed": false}
  }'::jsonb,
  'pending'
);

-- Insert another test application with different user
INSERT INTO public.vendor_applications (
  user_id,
  farm_name,
  farm_location,
  farm_description,
  business_phone,
  address,
  city,
  state,
  delivery_zones,
  business_hours,
  status
) VALUES (
  'YOUR_USER_ID_HERE', -- Replace with another user ID
  'Green Valley Farms',
  'Ogun State',
  'Specializing in poultry, eggs, and fresh vegetables. Farm-to-table service with excellent customer satisfaction.',
  '+234 803 987 6543',
  '45 Valley Road',
  'Abeokuta',
  'Ogun State',
  ARRAY['Abeokuta', 'Ibadan', 'Lagos'],
  '{
    "monday": {"open": "06:00", "close": "20:00", "closed": false},
    "tuesday": {"open": "06:00", "close": "20:00", "closed": false},
    "wednesday": {"open": "06:00", "close": "20:00", "closed": false},
    "thursday": {"open": "06:00", "close": "20:00", "closed": false},
    "friday": {"open": "06:00", "close": "20:00", "closed": false},
    "saturday": {"open": "06:00", "close": "20:00", "closed": false},
    "sunday": {"open": "09:00", "close": "17:00", "closed": false}
  }'::jsonb,
  'pending'
);

-- Verify applications were created
SELECT 
  va.id,
  va.farm_name,
  va.status,
  va.city,
  va.state,
  p.email as applicant_email,
  p.full_name as applicant_name,
  va.created_at
FROM vendor_applications va
LEFT JOIN profiles p ON p.id = va.user_id
WHERE va.status = 'pending'
ORDER BY va.created_at DESC;

-- Check if you're an admin
SELECT id, email, role FROM profiles WHERE role = 'admin';

-- If not admin, make yourself admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
