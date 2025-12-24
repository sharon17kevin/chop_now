-- Seed promotional banners
-- Run this in Supabase SQL Editor

-- Category-based banners (no specific product/vendor required)
INSERT INTO public.banners (
  title,
  subtitle,
  image_url,
  action_type,
  action_data,
  display_order,
  start_date,
  end_date,
  is_active
) VALUES
  (
    'Fresh from the Farm',
    'Organic vegetables delivered daily',
    'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg?auto=compress&cs=tinysrgb&w=800',
    'category',
    '{"category": "Vegetable"}',
    1,
    NOW(),
    NOW() + INTERVAL '30 days',
    true
  ),
  (
    'Winter Harvest Sale',
    'Up to 30% off seasonal produce',
    'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=800',
    'category',
    '{"category": "Fruits"}',
    2,
    NOW(),
    NOW() + INTERVAL '14 days',
    true
  ),
  (
    'Premium Dairy Products',
    'Fresh milk, cheese & yogurt',
    'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=800',
    'category',
    '{"category": "Dairy"}',
    3,
    NOW(),
    NOW() + INTERVAL '21 days',
    true
  );

-- Vendor spotlight banner (replace 'VENDOR_ID_HERE' with actual vendor UUID)
-- First, get a vendor ID:
-- SELECT id, full_name, farm_name FROM profiles WHERE role = 'vendor' AND verified = true LIMIT 1;

-- Then uncomment and run this INSERT with the actual vendor ID:
/*
INSERT INTO public.banners (
  title,
  subtitle,
  image_url,
  action_type,
  action_id,
  action_data,
  display_order,
  start_date,
  end_date,
  is_active
) VALUES (
  'Green Valley Farm',
  'Featured organic farm',
  'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vendor',
  'VENDOR_ID_HERE'::uuid,
  '{"vendorName": "Green Valley Farm"}',
  4,
  NOW(),
  NOW() + INTERVAL '7 days',
  true
);
*/

-- Product promotion banner (replace 'PRODUCT_ID_HERE' with actual product UUID)
-- First, get a product ID:
-- SELECT id, name FROM products WHERE is_available = true LIMIT 1;

-- Then uncomment and run this INSERT with the actual product ID:
/*
INSERT INTO public.banners (
  title,
  subtitle,
  image_url,
  action_type,
  action_id,
  display_order,
  start_date,
  end_date,
  is_active
) VALUES (
  'Featured Product',
  'Fresh organic tomatoes',
  'https://images.pexels.com/photos/1400172/pexels-photo-1400172.jpeg?auto=compress&cs=tinysrgb&w=800',
  'product',
  'PRODUCT_ID_HERE'::uuid,
  5,
  NOW(),
  NOW() + INTERVAL '7 days',
  true
);
*/

-- External URL banner (for app announcements, etc.)
INSERT INTO public.banners (
  title,
  subtitle,
  image_url,
  action_type,
  action_url,
  display_order,
  start_date,
  end_date,
  is_active
) VALUES (
  'New Features Available',
  'Check out what''s new in the app',
  'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=800',
  'url',
  'https://example.com/whats-new',
  6,
  NOW(),
  NOW() + INTERVAL '60 days',
  true
);

-- Verify the banners were created
SELECT id, title, action_type, is_active, start_date, end_date FROM public.banners;
