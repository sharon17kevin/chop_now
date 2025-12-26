-- Migration: Fix order_items RLS policies
-- Description: Add INSERT, UPDATE, DELETE policies for order_items table

-- Allow users to insert order items for their own orders
CREATE POLICY "Users can insert order items for their orders"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND auth.uid() = orders.user_id
    )
  );

-- Allow vendors to update order items for their orders
CREATE POLICY "Vendors can update order items"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND auth.uid() = orders.vendor_id
    )
  );

-- Allow users and vendors to delete order items
CREATE POLICY "Users can delete order items for their orders"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (auth.uid() = orders.user_id OR auth.uid() = orders.vendor_id)
    )
  );
