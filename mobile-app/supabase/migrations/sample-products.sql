-- ============================================================================
-- Sample Products for Chow Marketplace
-- Categories: Fruits, Vegetable, Dairy, Grains, Spices, Sauces, Meat, Legumes, Flour, Essentials
-- 5 products per category (50 total)
-- ============================================================================

-- NOTE: Replace 'YOUR_VENDOR_ID_HERE' with actual vendor UUID from your profiles table
-- You can get a vendor ID by running: SELECT id FROM profiles WHERE role = 'vendor' LIMIT 1;

-- ============================================================================
-- FRUITS (5 products)
-- ============================================================================

INSERT INTO products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES
('YOUR_VENDOR_ID_HERE', 'Fresh Bananas', 'Sweet ripe bananas from local farms', 500, 'https://images.pexels.com/photos/2316466/pexels-photo-2316466.jpeg?auto=compress&cs=tinysrgb&w=800', 'Fruits', 100, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Red Apples', 'Crisp and juicy red apples', 800, 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=800', 'Fruits', 75, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Fresh Oranges', 'Vitamin C rich sweet oranges', 600, 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=800', 'Fruits', 90, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Watermelon', 'Large sweet watermelons', 1200, 'https://images.pexels.com/photos/1313267/pexels-photo-1313267.jpeg?auto=compress&cs=tinysrgb&w=800', 'Fruits', 30, 'piece', true),
('YOUR_VENDOR_ID_HERE', 'Pineapple', 'Fresh tropical pineapples', 700, 'https://images.pexels.com/photos/947879/pexels-photo-947879.jpeg?auto=compress&cs=tinysrgb&w=800', 'Fruits', 45, 'piece', true);

-- ============================================================================
-- VEGETABLE (5 products)
-- ============================================================================

INSERT INTO products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES
('YOUR_VENDOR_ID_HERE', 'Fresh Tomatoes', 'Ripe red tomatoes for cooking', 400, 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=800', 'Vegetable', 120, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Bell Peppers', 'Colorful bell peppers mix', 900, 'https://images.pexels.com/photos/1268101/pexels-photo-1268101.jpeg?auto=compress&cs=tinysrgb&w=800', 'Vegetable', 60, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Carrots', 'Fresh crunchy carrots', 350, 'https://images.pexels.com/photos/3650647/pexels-photo-3650647.jpeg?auto=compress&cs=tinysrgb&w=800', 'Vegetable', 80, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Spinach', 'Fresh green spinach leaves', 500, 'https://images.pexels.com/photos/2255801/pexels-photo-2255801.jpeg?auto=compress&cs=tinysrgb&w=800', 'Vegetable', 50, 'bunch', true),
('YOUR_VENDOR_ID_HERE', 'Onions', 'Red and white onions', 300, 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=800', 'Vegetable', 150, 'kg', true);

-- ============================================================================
-- DAIRY (5 products)
-- ============================================================================

INSERT INTO products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES
('YOUR_VENDOR_ID_HERE', 'Fresh Milk', 'Full cream fresh milk', 1000, 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=800', 'Dairy', 40, 'liter', true),
('YOUR_VENDOR_ID_HERE', 'Yogurt', 'Natural plain yogurt', 800, 'https://images.pexels.com/photos/1202030/pexels-photo-1202030.jpeg?auto=compress&cs=tinysrgb&w=800', 'Dairy', 60, 'pack', true),
('YOUR_VENDOR_ID_HERE', 'Cheddar Cheese', 'Aged cheddar cheese', 2500, 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=800', 'Dairy', 25, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Butter', 'Salted butter', 1500, 'https://images.pexels.com/photos/4033328/pexels-photo-4033328.jpeg?auto=compress&cs=tinysrgb&w=800', 'Dairy', 35, 'pack', true),
('YOUR_VENDOR_ID_HERE', 'Fresh Eggs', 'Farm fresh eggs', 1200, 'https://images.pexels.com/photos/1556707/pexels-photo-1556707.jpeg?auto=compress&cs=tinysrgb&w=800', 'Dairy', 100, 'crate', true);

-- ============================================================================
-- GRAINS (5 products)
-- ============================================================================

INSERT INTO products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES
('YOUR_VENDOR_ID_HERE', 'White Rice', 'Premium long grain rice', 2500, 'https://images.pexels.com/photos/1029743/pexels-photo-1029743.jpeg?auto=compress&cs=tinysrgb&w=800', 'Grains', 200, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Brown Rice', 'Organic brown rice', 3000, 'https://images.pexels.com/photos/4033328/pexels-photo-4033328.jpeg?auto=compress&cs=tinysrgb&w=800', 'Grains', 150, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Oats', 'Rolled oats for breakfast', 1800, 'https://images.pexels.com/photos/543730/pexels-photo-543730.jpeg?auto=compress&cs=tinysrgb&w=800', 'Grains', 80, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Quinoa', 'Premium white quinoa', 4500, 'https://images.pexels.com/photos/1537169/pexels-photo-1537169.jpeg?auto=compress&cs=tinysrgb&w=800', 'Grains', 40, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Corn', 'Sweet yellow corn', 600, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800', 'Grains', 90, 'kg', true);

-- ============================================================================
-- SPICES (5 products)
-- ============================================================================

INSERT INTO products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES
('YOUR_VENDOR_ID_HERE', 'Black Pepper', 'Whole black pepper', 1500, 'https://images.pexels.com/photos/531446/pexels-photo-531446.jpeg?auto=compress&cs=tinysrgb&w=800', 'Spices', 50, 'pack', true),
('YOUR_VENDOR_ID_HERE', 'Curry Powder', 'Aromatic curry spice blend', 800, 'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=800', 'Spices', 70, 'pack', true),
('YOUR_VENDOR_ID_HERE', 'Turmeric', 'Ground turmeric powder', 1000, 'https://images.pexels.com/photos/4198027/pexels-photo-4198027.jpeg?auto=compress&cs=tinysrgb&w=800', 'Spices', 60, 'pack', true),
('YOUR_VENDOR_ID_HERE', 'Cinnamon Sticks', 'Ceylon cinnamon sticks', 2000, 'https://images.pexels.com/photos/4198022/pexels-photo-4198022.jpeg?auto=compress&cs=tinysrgb&w=800', 'Spices', 30, 'pack', true),
('YOUR_VENDOR_ID_HERE', 'Chili Powder', 'Hot chili powder', 700, 'https://images.pexels.com/photos/4198028/pexels-photo-4198028.jpeg?auto=compress&cs=tinysrgb&w=800', 'Spices', 80, 'pack', true);

-- ============================================================================
-- SAUCES (5 products)
-- ============================================================================

INSERT INTO products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES
('YOUR_VENDOR_ID_HERE', 'Vegetable Oil', 'Pure vegetable cooking oil', 1800, 'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=800', 'Sauces', 100, 'liter', true),
('YOUR_VENDOR_ID_HERE', 'Olive Oil', 'Extra virgin olive oil', 4500, 'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=800', 'Sauces', 40, 'liter', true),
('YOUR_VENDOR_ID_HERE', 'Tomato Paste', 'Concentrated tomato paste', 600, 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800', 'Sauces', 90, 'can', true),
('YOUR_VENDOR_ID_HERE', 'Soy Sauce', 'Premium soy sauce', 900, 'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=800', 'Sauces', 70, 'bottle', true),
('YOUR_VENDOR_ID_HERE', 'Hot Sauce', 'Spicy pepper sauce', 1200, 'https://images.pexels.com/photos/6942066/pexels-photo-6942066.jpeg?auto=compress&cs=tinysrgb&w=800', 'Sauces', 50, 'bottle', true);

-- ============================================================================
-- MEAT (5 products)
-- ============================================================================

INSERT INTO products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES
('YOUR_VENDOR_ID_HERE', 'Chicken Breast', 'Fresh boneless chicken breast', 2500, 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800', 'Meat', 50, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Beef Steak', 'Premium beef cuts', 4500, 'https://images.pexels.com/photos/3763816/pexels-photo-3763816.jpeg?auto=compress&cs=tinysrgb&w=800', 'Meat', 30, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Ground Beef', 'Fresh ground beef', 3000, 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800', 'Meat', 40, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Fresh Fish', 'Tilapia and catfish', 3500, 'https://images.pexels.com/photos/1907244/pexels-photo-1907244.jpeg?auto=compress&cs=tinysrgb&w=800', 'Meat', 35, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Lamb Chops', 'Tender lamb chops', 5500, 'https://images.pexels.com/photos/3763816/pexels-photo-3763816.jpeg?auto=compress&cs=tinysrgb&w=800', 'Meat', 20, 'kg', true);

-- ============================================================================
-- LEGUMES (5 products)
-- ============================================================================

INSERT INTO products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES
('YOUR_VENDOR_ID_HERE', 'Black Beans', 'Dried black beans', 1200, 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg?auto=compress&cs=tinysrgb&w=800', 'Legumes', 70, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Chickpeas', 'Premium chickpeas', 1500, 'https://images.pexels.com/photos/4198026/pexels-photo-4198026.jpeg?auto=compress&cs=tinysrgb&w=800', 'Legumes', 80, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Lentils', 'Red and brown lentils', 1000, 'https://images.pexels.com/photos/4198024/pexels-photo-4198024.jpeg?auto=compress&cs=tinysrgb&w=800', 'Legumes', 90, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Green Peas', 'Dried green peas', 900, 'https://images.pexels.com/photos/4198020/pexels-photo-4198020.jpeg?auto=compress&cs=tinysrgb&w=800', 'Legumes', 100, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Kidney Beans', 'Red kidney beans', 1100, 'https://images.pexels.com/photos/4198025/pexels-photo-4198025.jpeg?auto=compress&cs=tinysrgb&w=800', 'Legumes', 85, 'kg', true);

-- ============================================================================
-- FLOUR (5 products)
-- ============================================================================

INSERT INTO products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES
('YOUR_VENDOR_ID_HERE', 'All-Purpose Flour', 'White wheat flour', 800, 'https://images.pexels.com/photos/4033328/pexels-photo-4033328.jpeg?auto=compress&cs=tinysrgb&w=800', 'Flour', 150, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Whole Wheat Flour', 'Stone ground wheat flour', 1200, 'https://images.pexels.com/photos/1276553/pexels-photo-1276553.jpeg?auto=compress&cs=tinysrgb&w=800', 'Flour', 100, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Corn Flour', 'Fine corn flour', 900, 'https://images.pexels.com/photos/4033328/pexels-photo-4033328.jpeg?auto=compress&cs=tinysrgb&w=800', 'Flour', 120, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Rice Flour', 'Gluten-free rice flour', 1500, 'https://images.pexels.com/photos/1029743/pexels-photo-1029743.jpeg?auto=compress&cs=tinysrgb&w=800', 'Flour', 60, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Cassava Flour', 'Fufu flour', 1000, 'https://images.pexels.com/photos/4033328/pexels-photo-4033328.jpeg?auto=compress&cs=tinysrgb&w=800', 'Flour', 80, 'kg', true);

-- ============================================================================
-- ESSENTIALS (5 products)
-- ============================================================================

INSERT INTO products (vendor_id, name, description, price, image_url, category, stock, unit, is_available) VALUES
('YOUR_VENDOR_ID_HERE', 'Sugar', 'White granulated sugar', 700, 'https://images.pexels.com/photos/65882/pexels-photo-65882.jpeg?auto=compress&cs=tinysrgb&w=800', 'Essentials', 200, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Salt', 'Iodized table salt', 300, 'https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&cs=tinysrgb&w=800', 'Essentials', 250, 'kg', true),
('YOUR_VENDOR_ID_HERE', 'Cooking Gas', '12.5kg cooking gas refill', 8000, 'https://images.pexels.com/photos/4033328/pexels-photo-4033328.jpeg?auto=compress&cs=tinysrgb&w=800', 'Essentials', 50, 'cylinder', true),
('YOUR_VENDOR_ID_HERE', 'Bottled Water', 'Pure drinking water', 500, 'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=800', 'Essentials', 300, 'pack', true),
('YOUR_VENDOR_ID_HERE', 'Charcoal', 'Quality cooking charcoal', 1500, 'https://images.pexels.com/photos/1687345/pexels-photo-1687345.jpeg?auto=compress&cs=tinysrgb&w=800', 'Essentials', 100, 'bag', true);

-- ============================================================================
-- INSTRUCTIONS TO USE THIS FILE:
-- ============================================================================
-- 1. Get a vendor ID from your database:
--    SELECT id FROM profiles WHERE role = 'vendor' LIMIT 1;
--
-- 2. Replace ALL instances of 'YOUR_VENDOR_ID_HERE' with the actual UUID
--    (Use Find & Replace in your editor: Ctrl+H or Cmd+H)
--
-- 3. Run this SQL in your Supabase SQL Editor or via psql
--
-- 4. Verify products were inserted:
--    SELECT category, COUNT(*) FROM products GROUP BY category ORDER BY category;
--
-- Expected Result: 5 products in each of the 10 categories (50 total)
-- ============================================================================
