-- =============================================================================
-- Migration: Create cart_items table for user shopping carts
-- Created: 2025-11-19
-- Description: Stores temporary cart items before checkout (converted to orders)
-- =============================================================================

-- Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate products in same user's cart
  UNIQUE(user_id, product_id)
);

-- Add indexes for performance
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX idx_cart_items_created_at ON public.cart_items(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cart_items_updated_at_trigger ON public.cart_items;
CREATE TRIGGER cart_items_updated_at_trigger
BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.update_cart_items_updated_at();

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/modify their own cart items
CREATE POLICY "Users can view own cart items"
ON public.cart_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
ON public.cart_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
ON public.cart_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
ON public.cart_items
FOR DELETE
USING (auth.uid() = user_id);

-- Optional: Auto-cleanup old cart items (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_cart_items()
RETURNS void AS $$
BEGIN
  DELETE FROM public.cart_items
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE public.cart_items IS 'Temporary shopping cart items before checkout. Converted to orders on payment.';
