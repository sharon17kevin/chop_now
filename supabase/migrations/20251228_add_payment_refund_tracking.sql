-- Add payment and refund tracking to orders table
-- This enables linking orders to Paystack payments and processing refunds

-- Add payment tracking fields
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partially_refunded', 'failed')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10, 2) CHECK (payment_amount >= 0);

-- Add refund tracking fields
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2) CHECK (refund_amount >= 0),
ADD COLUMN IF NOT EXISTS refund_reference TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_method TEXT CHECK (refund_method IN ('wallet', 'paystack', 'manual'));

-- Add cancellation metadata fields
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Create index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON public.orders(payment_reference);

-- Create index for refund status queries
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON public.orders(refund_status) WHERE refund_status IS NOT NULL;

-- Create refunds audit table for tracking refund operations
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_reference TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  refund_method TEXT NOT NULL CHECK (refund_method IN ('wallet', 'paystack', 'manual')),
  paystack_refund_id TEXT,
  paystack_response JSONB,
  initiated_by UUID NOT NULL REFERENCES public.profiles(id),
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for refunds table
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_reference ON public.refunds(payment_reference);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_initiated_by ON public.refunds(initiated_by);

-- Enable Row Level Security
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for refunds table

-- Users can view their own refunds (as customer)
CREATE POLICY "Users can view their own refunds"
  ON public.refunds
  FOR SELECT
  USING (
    initiated_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = refunds.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Vendors can view refunds for their orders
CREATE POLICY "Vendors can view refunds for their orders"
  ON public.refunds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = refunds.order_id
      AND orders.vendor_id = auth.uid()
    )
  );

-- Only authenticated users can initiate refunds (will be restricted by edge function)
CREATE POLICY "Authenticated users can create refunds"
  ON public.refunds
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger to update refunds updated_at timestamp
CREATE OR REPLACE FUNCTION update_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_refunds_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.refunds IS 'Audit trail for all refund operations with Paystack integration tracking';
COMMENT ON COLUMN public.orders.payment_reference IS 'Paystack payment reference from checkout';
COMMENT ON COLUMN public.orders.payment_status IS 'Current payment state: pending, paid, refunded, partially_refunded, failed';
COMMENT ON COLUMN public.orders.refund_status IS 'Current refund processing state: pending, processing, completed, failed';
COMMENT ON COLUMN public.orders.refund_method IS 'How refund was processed: wallet (instant credit), paystack (bank refund), manual (admin action)';
