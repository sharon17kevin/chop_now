-- ============================================================================
-- ESCROW & VENDOR PAYOUT SYSTEM
-- ============================================================================
-- Created: January 27, 2026
-- Purpose: Implement secure payment escrow and vendor payout infrastructure
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADD ESCROW FIELDS TO ORDERS TABLE
-- ----------------------------------------------------------------------------

-- Escrow tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_status TEXT CHECK (escrow_status IN ('held', 'released', 'reversed')) DEFAULT 'held';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS funds_released_at TIMESTAMPTZ;

-- Platform fees
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_percentage NUMERIC(5, 2) DEFAULT 5.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10, 2) DEFAULT 0;

-- Vendor payout
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor_payout_amount NUMERIC(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_status TEXT CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed', 'on_hold')) DEFAULT 'on_hold';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_completed_at TIMESTAMPTZ;

-- Auto-release scheduling
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eligible_for_release_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS release_hold_reason TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_escrow_status ON orders(escrow_status);
CREATE INDEX IF NOT EXISTS idx_orders_payout_status ON orders(payout_status);
CREATE INDEX IF NOT EXISTS idx_orders_eligible_for_release ON orders(eligible_for_release_at) 
  WHERE escrow_status = 'held' AND eligible_for_release_at IS NOT NULL;

-- Add comments
COMMENT ON COLUMN orders.escrow_status IS 'held: funds locked | released: paid to vendor | reversed: refunded to customer';
COMMENT ON COLUMN orders.eligible_for_release_at IS 'Timestamp when funds can auto-release (typically delivered_at + 24 hours)';

-- ----------------------------------------------------------------------------
-- 2. ADD VENDOR BANK ACCOUNT FIELDS TO PROFILES
-- ----------------------------------------------------------------------------

-- Bank details for payouts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Paystack integration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paystack_recipient_code TEXT;

-- Payout settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_schedule TEXT CHECK (payout_schedule IN ('instant', 'daily', 'weekly', 'manual')) DEFAULT 'daily';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS minimum_payout_amount NUMERIC(10, 2) DEFAULT 5000.00;

-- Verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_verified_at TIMESTAMPTZ;

-- Add index
CREATE INDEX IF NOT EXISTS idx_profiles_payout_enabled ON profiles(payout_enabled) WHERE payout_enabled = true;

-- ----------------------------------------------------------------------------
-- 3. CREATE VENDOR PAYOUTS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vendor_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'NGN',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wallet', 'bank_transfer')),
  order_ids UUID[] NOT NULL,
  order_count INTEGER NOT NULL DEFAULT 1,
  bank_account_number TEXT,
  bank_name TEXT,
  account_name TEXT,
  paystack_transfer_id TEXT,
  paystack_transfer_code TEXT,
  paystack_response JSONB,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON vendor_payouts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_created_at ON vendor_payouts(created_at DESC);

CREATE TRIGGER update_vendor_payouts_updated_at
  BEFORE UPDATE ON vendor_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. CREATE PLATFORM EARNINGS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('commission', 'delivery_fee', 'service_fee', 'promo_subsidy', 'other')),
  description TEXT,
  percentage_charged NUMERIC(5, 2),
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  order_created_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_earnings_order_id ON platform_earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_type ON platform_earnings(type);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_collected_at ON platform_earnings(collected_at DESC);

-- ----------------------------------------------------------------------------
-- 5. CREATE FUNCTION: CALCULATE ESCROW AMOUNTS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_escrow_amounts(
  p_order_total NUMERIC,
  p_platform_fee_percentage NUMERIC DEFAULT 5.00
)
RETURNS TABLE (
  platform_fee NUMERIC,
  vendor_payout NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(p_order_total * (p_platform_fee_percentage / 100.0), 2) AS platform_fee,
    ROUND(p_order_total - (p_order_total * (p_platform_fee_percentage / 100.0)), 2) AS vendor_payout;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- 6. CREATE FUNCTION: RELEASE ESCROW TO VENDOR
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION release_escrow_to_vendor(
  p_order_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_vendor_payout NUMERIC;
  v_platform_fee NUMERIC;
  v_wallet_result JSON;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  IF v_order.escrow_status != 'held' THEN
    RETURN json_build_object('success', false, 'error', 'Escrow already processed');
  END IF;
  
  IF v_order.payment_status != 'paid' THEN
    RETURN json_build_object('success', false, 'error', 'Payment not confirmed');
  END IF;
  
  IF v_order.status NOT IN ('delivered', 'completed') THEN
    RETURN json_build_object('success', false, 'error', 'Order not yet delivered');
  END IF;
  
  SELECT platform_fee, vendor_payout INTO v_platform_fee, v_vendor_payout
  FROM calculate_escrow_amounts(v_order.total, COALESCE(v_order.platform_fee_percentage, 5.00));
  
  SELECT credit_wallet(
    v_order.vendor_id,
    v_vendor_payout,
    format('Earnings from order #%s', SUBSTRING(v_order.id::TEXT, 1, 8)),
    format('escrow_release_%s', v_order.id)
  ) INTO v_wallet_result;
  
  IF (v_wallet_result->>'success')::BOOLEAN != true THEN
    RETURN json_build_object('success', false, 'error', 'Failed to credit vendor wallet');
  END IF;
  
  UPDATE orders SET
    escrow_status = 'released',
    funds_released_at = NOW(),
    platform_fee_amount = v_platform_fee,
    vendor_payout_amount = v_vendor_payout,
    payout_status = 'pending',
    updated_at = NOW()
  WHERE id = p_order_id;
  
  INSERT INTO platform_earnings (order_id, vendor_id, amount, type, description, percentage_charged, collected_at)
  VALUES (v_order.id, v_order.vendor_id, v_platform_fee, 'commission',
    format('Platform commission from order #%s', SUBSTRING(v_order.id::TEXT, 1, 8)),
    v_order.platform_fee_percentage, NOW());
  
  INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
  VALUES (v_order.vendor_id, 'Payment Released',
    format('%.2f from order #%s has been added to your wallet', v_vendor_payout, SUBSTRING(v_order.id::TEXT, 1, 8)),
    'payment', v_order.id, 'order');
  
  RETURN json_build_object('success', true, 'vendor_payout', v_vendor_payout, 'platform_fee', v_platform_fee);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 7. CREATE FUNCTION: SET ORDER DELIVERY AND SCHEDULE RELEASE
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_order_delivered(
  p_order_id UUID,
  p_release_delay_hours INTEGER DEFAULT 24
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
BEGIN
  UPDATE orders SET
    status = 'delivered',
    eligible_for_release_at = NOW() + (p_release_delay_hours || ' hours')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  RETURN json_build_object('success', true, 'eligible_for_release_at', v_order.eligible_for_release_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 8. CREATE FUNCTION: AUTO-RELEASE ELIGIBLE ESCROW
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auto_release_eligible_escrow()
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_released_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_release_result JSON;
BEGIN
  FOR v_order IN
    SELECT id FROM orders
    WHERE escrow_status = 'held'
      AND status IN ('delivered', 'completed')
      AND eligible_for_release_at IS NOT NULL
      AND eligible_for_release_at <= NOW()
      AND payment_status = 'paid'
    ORDER BY eligible_for_release_at ASC
    LIMIT 100
  LOOP
    SELECT release_escrow_to_vendor(v_order.id) INTO v_release_result;
    IF (v_release_result->>'success')::BOOLEAN THEN
      v_released_count := v_released_count + 1;
    ELSE
      v_failed_count := v_failed_count + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object('success', true, 'released_count', v_released_count, 'failed_count', v_failed_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 9. UPDATE EXISTING ORDERS
-- ----------------------------------------------------------------------------

UPDATE orders SET 
  escrow_status = CASE 
    WHEN status = 'delivered' AND payment_status = 'paid' THEN 'released'
    WHEN payment_status = 'paid' THEN 'held'
    WHEN payment_status = 'refunded' THEN 'reversed'
    ELSE 'held'
  END,
  platform_fee_percentage = 5.00,
  platform_fee_amount = ROUND(total * 0.05, 2),
  vendor_payout_amount = ROUND(total * 0.95, 2),
  payout_status = CASE WHEN status = 'delivered' THEN 'pending' ELSE 'on_hold' END
WHERE escrow_status IS NULL;

-- ----------------------------------------------------------------------------
-- 10. PERMISSIONS
-- ----------------------------------------------------------------------------

GRANT SELECT ON vendor_payouts TO authenticated;
GRANT SELECT ON platform_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_escrow_amounts TO authenticated;
GRANT EXECUTE ON FUNCTION release_escrow_to_vendor TO authenticated;
GRANT EXECUTE ON FUNCTION set_order_delivered TO authenticated;
GRANT EXECUTE ON FUNCTION auto_release_eligible_escrow TO authenticated;

-- RLS
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_payouts_select_own ON vendor_payouts FOR SELECT USING (vendor_id = auth.uid());

ALTER TABLE platform_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_earnings_admin_only ON platform_earnings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
