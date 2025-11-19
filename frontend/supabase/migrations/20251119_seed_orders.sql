-- =============================================================================
-- Seed Data: Sample Orders for Testing
-- Date: November 19, 2025
-- Description: Populates the orders and order_items tables with test data
-- 
-- IMPORTANT: Replace 'YOUR_USER_ID' and 'YOUR_VENDOR_ID' with actual UUIDs
-- from your profiles table before running this migration.
-- 
-- To get your IDs, run:
-- SELECT id, email, role FROM public.profiles WHERE role IN ('customer', 'vendor') LIMIT 5;
-- =============================================================================

BEGIN;

-- Insert sample orders
-- NOTE: Replace 'YOUR_USER_ID' and 'YOUR_VENDOR_ID' with actual UUIDs
INSERT INTO public.orders (
  user_id,
  vendor_id,
  total,
  status,
  delivery_address,
  delivery_notes
) VALUES
-- Active orders (pending)
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 2499.00, 'pending', 'No. 5 Lekki Phase 1, Lagos', 'Please handle with care'),
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 4500.00, 'pending', 'VI, Lagos', 'Ring doorbell twice'),

-- Ongoing orders (processing/confirmed)
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 3200.00, 'confirmed', 'Ikoyi, Lagos', ''),
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 5600.00, 'processing', 'Ajah, Lagos', 'Leave at gate'),
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 1800.00, 'processing', 'Yaba, Lagos', ''),

-- Cancelled orders
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 2100.00, 'cancelled', 'Surulere, Lagos', 'Out of stock items'),

-- Completed orders (delivered)
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 4200.00, 'delivered', 'Lekki Gardens, Lagos', ''),
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 3500.00, 'delivered', 'Victoria Island, Lagos', ''),
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 2800.00, 'delivered', 'Oniru, Lagos', ''),
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 5200.00, 'delivered', 'Ikoyi, Lagos', ''),
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 1950.00, 'delivered', 'Banana Island, Lagos', ''),
('YOUR_USER_ID', 'YOUR_VENDOR_ID', 6300.00, 'delivered', 'Abuja CBD, Abuja', '');

-- Note: Insert order_items separately if needed
-- For now, orders are created. You can populate order_items table with:
-- INSERT INTO public.order_items (order_id, product_id, quantity, unit_price) VALUES ...

COMMIT;
