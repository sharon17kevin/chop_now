-- =============================================================================
-- Seed Data: Sample Products for Testing
-- Date: November 19, 2025
-- Description: Populates the products table with Nigerian agricultural products
-- 
-- IMPORTANT: Replace 'YOUR_VENDOR_USER_ID' with an actual vendor user ID from 
-- your profiles table before running this migration.
-- 
-- To get your vendor ID, run:
-- SELECT id, email, role FROM public.profiles WHERE role = 'vendor' LIMIT 1;
-- =============================================================================

BEGIN;

-- Insert sample products
-- NOTE: Replace 'YOUR_VENDOR_USER_ID' with your actual vendor user ID
INSERT INTO public.products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES

-- Fruits
('YOUR_VENDOR_USER_ID', 'Fresh Tomatoes', 'Locally grown ripe tomatoes, perfect for stews and salads', 500.00, 'https://images.unsplash.com/photo-1546470427-5a3d3d6f6e3a?w=400', 'Fruits', 50, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Sweet Oranges', 'Juicy Nigerian oranges, rich in vitamin C', 800.00, 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=400', 'Fruits', 100, 'dozen', true),
('YOUR_VENDOR_USER_ID', 'Ripe Plantains', 'Sweet yellow plantains ready for frying', 300.00, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', 'Fruits', 200, 'bunch', true),
('YOUR_VENDOR_USER_ID', 'Fresh Pineapples', 'Sweet and tangy pineapples from Jos', 1200.00, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400', 'Fruits', 30, 'piece', true),
('YOUR_VENDOR_USER_ID', 'Watermelon', 'Large sweet watermelons, perfect for hot weather', 2000.00, 'https://images.unsplash.com/photo-1587049352846-4a222e784463?w=400', 'Fruits', 20, 'piece', true),
('YOUR_VENDOR_USER_ID', 'Bananas', 'Fresh ripe bananas, great for snacking', 250.00, 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400', 'Fruits', 150, 'bunch', true),
('YOUR_VENDOR_USER_ID', 'Mangoes', 'Sweet Julie mangoes from the north', 600.00, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', 'Fruits', 80, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Pawpaw', 'Ripe pawpaw (papaya) for breakfast', 400.00, 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400', 'Fruits', 40, 'piece', true),

-- Vegetables
('YOUR_VENDOR_USER_ID', 'Fresh Spinach', 'Green leafy vegetables, rich in iron', 200.00, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', 'Vegetables', 80, 'bunch', true),
('YOUR_VENDOR_USER_ID', 'Bell Peppers', 'Fresh red and green bell peppers', 600.00, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400', 'Vegetables', 40, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Fresh Carrots', 'Crunchy orange carrots from the north', 400.00, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400', 'Vegetables', 60, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Red Onions', 'Fresh red onions for cooking', 350.00, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400', 'Vegetables', 100, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Green Cabbage', 'Fresh cabbage heads, great for salads', 250.00, 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400', 'Vegetables', 45, 'piece', true),
('YOUR_VENDOR_USER_ID', 'Fresh Cucumber', 'Crisp cucumbers for salads', 150.00, 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400', 'Vegetables', 70, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Green Beans', 'Fresh string beans', 450.00, 'https://images.unsplash.com/photo-1592382112107-338e45eb8aad?w=400', 'Vegetables', 50, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Ugu Leaves', 'Fresh pumpkin leaves (Ugu) for soup', 180.00, 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400', 'Vegetables', 90, 'bunch', true),

-- Grains
('YOUR_VENDOR_USER_ID', 'Local Rice', 'Premium quality Nigerian rice', 25000.00, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'Grains', 100, '50kg bag', true),
('YOUR_VENDOR_USER_ID', 'White Beans', 'High-quality beans for moi moi and akara', 800.00, 'https://images.unsplash.com/photo-1589994160410-2825a9611c6b?w=400', 'Grains', 150, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Yellow Maize', 'Fresh yellow corn for pap and swallow', 15000.00, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400', 'Grains', 80, '50kg bag', true),
('YOUR_VENDOR_USER_ID', 'Millet', 'Nutritious millet grains', 600.00, 'https://images.unsplash.com/photo-1600490916171-e20eb5c46a8a?w=400', 'Grains', 70, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Sorghum', 'Guinea corn for making pap', 550.00, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', 'Grains', 60, 'kg', true),

-- Dairy
('YOUR_VENDOR_USER_ID', 'Fresh Milk', 'Farm-fresh cow milk', 1500.00, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', 'Dairy', 30, 'liter', true),
('YOUR_VENDOR_USER_ID', 'Local Cheese', 'Handmade Nigerian cheese (wara)', 2000.00, 'https://images.unsplash.com/photo-1589881133595-2cd5c5f7df52?w=400', 'Dairy', 25, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Fresh Yogurt', 'Homemade natural yogurt', 1200.00, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', 'Dairy', 40, 'liter', true),

-- Herbs & Spices
('YOUR_VENDOR_USER_ID', 'Fresh Ginger', 'Organic ginger root', 800.00, 'https://images.unsplash.com/photo-1599904675746-2ac4e46d0e4a?w=400', 'Herbs', 40, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Fresh Garlic', 'Aromatic garlic bulbs', 1200.00, 'https://images.unsplash.com/photo-1583489964625-87fa8ebb19d5?w=400', 'Herbs', 35, 'kg', true),
('YOUR_VENDOR_USER_ID', 'Scent Leaves', 'Fresh basil (scent leaves) for soups', 150.00, 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=400', 'Herbs', 60, 'bunch', true),
('YOUR_VENDOR_USER_ID', 'Uziza Leaves', 'Traditional Nigerian spice leaves', 200.00, 'https://images.unsplash.com/photo-1593258387185-f34c58e98214?w=400', 'Herbs', 50, 'bunch', true),
('YOUR_VENDOR_USER_ID', 'Fresh Curry Leaves', 'Aromatic curry leaves', 120.00, 'https://images.unsplash.com/photo-1596040033229-a0b4c2c5d7dd?w=400', 'Herbs', 70, 'bunch', true),
('YOUR_VENDOR_USER_ID', 'Bitter Leaf', 'Fresh bitter leaves for soup', 180.00, 'https://images.unsplash.com/photo-1613743983303-b3e89f8a7e2d?w=400', 'Herbs', 55, 'bunch', true),

-- Other
('YOUR_VENDOR_USER_ID', 'Palm Oil', 'Fresh red palm oil', 3500.00, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', 'Other', 50, '5L bottle', true),
('YOUR_VENDOR_USER_ID', 'Groundnut Oil', 'Pure groundnut cooking oil', 4000.00, 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400', 'Other', 40, '5L bottle', true),
('YOUR_VENDOR_USER_ID', 'Honey', 'Pure natural honey', 2500.00, 'https://images.unsplash.com/photo-1587049352846-4a222e784463?w=400', 'Other', 30, 'bottle', true),
('YOUR_VENDOR_USER_ID', 'Dried Fish', 'Smoked dried fish', 3000.00, 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=400', 'Other', 45, 'kg', true);

COMMIT;
