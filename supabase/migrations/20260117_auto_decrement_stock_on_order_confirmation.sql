-- Migration: Auto-decrement stock on order confirmation
-- Description: Automatically manages product stock when orders are confirmed or cancelled

-- Function to decrement product stock when order status changes to 'confirmed'
CREATE OR REPLACE FUNCTION decrement_stock_on_order_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed from something else to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Decrement stock for each order item
    UPDATE products p
    SET 
      stock = p.stock - oi.quantity,
      updated_at = NOW()
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id
      AND p.stock >= oi.quantity; -- Only decrement if enough stock
    
    -- Check if any product doesn't have enough stock
    IF EXISTS (
      SELECT 1
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = NEW.id
        AND p.stock < oi.quantity
    ) THEN
      RAISE EXCEPTION 'Insufficient stock for one or more products in order %', NEW.id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_decrement_stock_on_confirmation ON orders;
CREATE TRIGGER trigger_decrement_stock_on_confirmation
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_order_confirmation();

-- Function to restore stock when order is cancelled
CREATE OR REPLACE FUNCTION restore_stock_on_order_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    
    -- Only restore stock if order was previously confirmed (stock was decremented)
    IF OLD.status IN ('confirmed', 'processing') THEN
      UPDATE products p
      SET 
        stock = p.stock + oi.quantity,
        updated_at = NOW()
      FROM order_items oi
      WHERE oi.order_id = NEW.id
        AND oi.product_id = p.id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock restoration
DROP TRIGGER IF EXISTS trigger_restore_stock_on_cancellation ON orders;
CREATE TRIGGER trigger_restore_stock_on_cancellation
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_order_cancellation();

-- Comments for documentation
-- decrement_stock_on_order_confirmation(): Automatically decrements product stock when vendor confirms an order. Validates sufficient stock exists.
-- restore_stock_on_order_cancellation(): Automatically restores product stock when an order is cancelled (only if it was confirmed/processing).
-- trigger_decrement_stock_on_confirmation: Triggers stock decrement when order status changes to confirmed
-- trigger_restore_stock_on_cancellation: Triggers stock restoration when order is cancelled after being confirmed
