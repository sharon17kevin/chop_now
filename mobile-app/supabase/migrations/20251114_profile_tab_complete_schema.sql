-- =============================================================================
-- Migration: Complete Profile Tab Database Schema
-- Date: November 14, 2025
-- Description: Creates all tables needed for profile tab functionality including
-- products, orders, wishlist, notifications, payment methods, addresses, 
-- settings, and support system
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. PRODUCTS TABLE (Core marketplace)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  category TEXT,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  unit TEXT DEFAULT 'kg',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_available ON public.products(is_available);

-- =============================================================================
-- 2. ORDERS & ORDER_ITEMS TABLES (Order management)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'processing', 'delivered', 'cancelled')) DEFAULT 'pending',
  delivery_address TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- =============================================================================
-- 3. WISHLIST TABLE (Favorites)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON public.wishlist(product_id);

-- =============================================================================
-- 4. NOTIFICATIONS TABLE (In-app notifications)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'promotion', 'alert', 'system', 'message')) DEFAULT 'system',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- =============================================================================
-- 5. ADDRESSES TABLE (Delivery addresses)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'Nigeria',
  postal_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX idx_addresses_is_default ON public.addresses(is_default);

-- Ensure only one default per user
CREATE UNIQUE INDEX idx_addresses_default 
ON public.addresses(user_id) 
WHERE is_default = true;

-- =============================================================================
-- 6. PAYMENT_METHODS TABLE (Tokenized - NO raw card data!)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_transfer', 'wallet')) DEFAULT 'card',
  
  -- Provider tokens (Paystack/Flutterwave)
  payment_provider TEXT NOT NULL, -- 'paystack', 'flutterwave', 'stripe'
  provider_token TEXT NOT NULL, -- Tokenized reference
  
  -- Display info only (masked)
  card_last_four TEXT,
  card_brand TEXT, -- 'visa', 'mastercard', 'verve', 'naira_master'
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_payment_methods_is_default ON public.payment_methods(is_default);

-- Ensure only one default per user
CREATE UNIQUE INDEX idx_payment_methods_default 
ON public.payment_methods(user_id) 
WHERE is_default = true;

-- =============================================================================
-- 7. APP_SETTINGS TABLE (User preferences)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Appearance
  theme TEXT CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',
  
  -- Notifications
  notifications_enabled BOOLEAN DEFAULT true,
  notification_types JSONB DEFAULT '{"orders": true, "promotions": true, "messages": true}'::jsonb,
  
  -- Privacy
  profile_visibility TEXT CHECK (profile_visibility IN ('public', 'private')) DEFAULT 'public',
  show_online_status BOOLEAN DEFAULT true,
  
  -- Communication
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'NGN',
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_settings_user_id ON public.app_settings(user_id);

-- =============================================================================
-- 8. SUPPORT SYSTEM TABLES (Help & Support)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.faq_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  not_helpful_count INTEGER DEFAULT 0 CHECK (not_helpful_count >= 0),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  attachments TEXT[],
  is_staff_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faq_category ON public.faq_articles(category);
CREATE INDEX idx_faq_is_published ON public.faq_articles(is_published);
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at DESC);

-- =============================================================================
-- 9. TRIGGERS FOR AUTO-UPDATES
-- =============================================================================

-- Update favorite_count on wishlist changes
CREATE OR REPLACE FUNCTION public.update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET favorite_count = favorite_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET favorite_count = favorite_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wishlist_count_trigger ON public.wishlist;
CREATE TRIGGER wishlist_count_trigger
AFTER INSERT OR DELETE ON public.wishlist
FOR EACH ROW EXECUTE FUNCTION public.update_favorite_count();

-- Update total_orders and total_sales on order creation
CREATE OR REPLACE FUNCTION public.update_order_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update customer order count
    UPDATE public.profiles SET total_orders = total_orders + 1 WHERE id = NEW.user_id;
    -- Update vendor sales count
    UPDATE public.profiles SET total_sales = total_sales + 1 WHERE id = NEW.vendor_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_count_trigger ON public.orders;
CREATE TRIGGER order_count_trigger
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_order_counts();

-- =============================================================================
-- 10. RLS POLICIES (Row Level Security)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: Everyone can read available products, vendors can read their own
CREATE POLICY "Anyone can read available products"
  ON public.products FOR SELECT
  USING (is_available = true);

CREATE POLICY "Vendors can read own products"
  ON public.products FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Vendors can insert own products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = vendor_id);

-- ORDERS: Users can only see their own orders
CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = vendor_id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Customers can insert own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = vendor_id);

-- ORDER_ITEMS: Inherit from orders
CREATE POLICY "Users can read order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (auth.uid() = orders.user_id OR auth.uid() = orders.vendor_id)
    )
  );

-- WISHLIST: Users can only manage their own
CREATE POLICY "Users can read own wishlist"
  ON public.wishlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist"
  ON public.wishlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist"
  ON public.wishlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- NOTIFICATIONS: Users can only read their own
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ADDRESSES: Users can only manage their own
CREATE POLICY "Users can read own addresses"
  ON public.addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON public.addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON public.addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON public.addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- PAYMENT_METHODS: Users can only manage their own
CREATE POLICY "Users can read own payment methods"
  ON public.payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
  ON public.payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
  ON public.payment_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON public.payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- APP_SETTINGS: Users can only manage their own
CREATE POLICY "Users can read own settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- FAQ: Everyone can read published articles
CREATE POLICY "Anyone can read FAQ"
  ON public.faq_articles FOR SELECT
  USING (is_published = true);

-- SUPPORT_TICKETS: Users can read own tickets, admins can read all
CREATE POLICY "Users can read own tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert own tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'admin');

-- SUPPORT_MESSAGES: Inherit from tickets
CREATE POLICY "Users can read ticket messages"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND (auth.uid() = support_tickets.user_id OR public.get_user_role(auth.uid()) = 'admin')
    )
  );

CREATE POLICY "Users can insert ticket messages"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE support_tickets.id = ticket_id 
      AND auth.uid() = support_tickets.user_id
    )
  );

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'products', 'orders', 'order_items', 'wishlist', 'notifications',
  'addresses', 'payment_methods', 'app_settings', 'faq_articles',
  'support_tickets', 'support_messages'
)
ORDER BY table_name;

-- Check all indexes created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
  'products', 'orders', 'order_items', 'wishlist', 'notifications',
  'addresses', 'payment_methods', 'app_settings', 'faq_articles',
  'support_tickets', 'support_messages'
)
ORDER BY indexname;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'products', 'orders', 'order_items', 'wishlist', 'notifications',
  'addresses', 'payment_methods', 'app_settings', 'faq_articles',
  'support_tickets', 'support_messages'
)
ORDER BY tablename;
