-- Create promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  per_user_limit INTEGER DEFAULT 1 CHECK (per_user_limit > 0),
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  applicable_categories TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create promo code usage tracking table
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10, 2) NOT NULL CHECK (discount_amount >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(promo_code_id, order_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_codes_vendor ON promo_codes(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON promo_code_usage(user_id, promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promo_code_usage(promo_code_id);

-- Add promo fields to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id),
  ADD COLUMN IF NOT EXISTS promo_discount DECIMAL(10, 2) DEFAULT 0;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promo_codes_updated_at 
    BEFORE UPDATE ON promo_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Validation function for promo codes
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code VARCHAR,
  p_user_id UUID,
  p_order_total DECIMAL,
  p_vendor_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_usage_count INTEGER;
  v_discount DECIMAL;
BEGIN
  -- Normalize code to uppercase
  p_code := UPPER(TRIM(p_code));
  
  -- Fetch promo code with all validations
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE code = p_code
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (vendor_id IS NULL OR vendor_id = p_vendor_id);

  -- Check if promo code exists and is valid
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false, 
      'error', 'Invalid or expired promo code'
    );
  END IF;

  -- Check minimum order amount
  IF p_order_total < v_promo.min_order_amount THEN
    RETURN json_build_object(
      'valid', false, 
      'error', 'Minimum order amount is ₦' || v_promo.min_order_amount::TEXT
    );
  END IF;

  -- Check global usage limit
  IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
    RETURN json_build_object(
      'valid', false, 
      'error', 'This promo code has reached its usage limit'
    );
  END IF;

  -- Check per-user usage limit
  SELECT COUNT(*) INTO v_usage_count
  FROM promo_code_usage
  WHERE promo_code_id = v_promo.id 
    AND user_id = p_user_id;

  IF v_promo.per_user_limit IS NOT NULL AND v_usage_count >= v_promo.per_user_limit THEN
    RETURN json_build_object(
      'valid', false, 
      'error', 'You have already used this promo code'
    );
  END IF;

  -- Calculate discount
  IF v_promo.discount_type = 'percentage' THEN
    v_discount := p_order_total * (v_promo.discount_value / 100);
    -- Apply max discount cap if set
    IF v_promo.max_discount_amount IS NOT NULL THEN
      v_discount := LEAST(v_discount, v_promo.max_discount_amount);
    END IF;
  ELSE -- fixed discount
    v_discount := v_promo.discount_value;
    -- Don't allow discount to exceed order total
    v_discount := LEAST(v_discount, p_order_total);
  END IF;

  -- Return success with discount details
  RETURN json_build_object(
    'valid', true,
    'promo_id', v_promo.id,
    'code', v_promo.code,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'discount_amount', ROUND(v_discount, 2),
    'description', v_promo.description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record promo usage after order
CREATE OR REPLACE FUNCTION record_promo_usage(
  p_promo_code_id UUID,
  p_user_id UUID,
  p_order_id UUID,
  p_discount_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  -- Insert usage record
  INSERT INTO promo_code_usage (promo_code_id, user_id, order_id, discount_amount)
  VALUES (p_promo_code_id, p_user_id, p_order_id, p_discount_amount);
  
  -- Increment usage count
  UPDATE promo_codes 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = p_promo_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_until) 
VALUES
  ('WELCOME10', 'Welcome offer - 10% off your first order', 'percentage', 10, 1000, 500, NULL, '2026-12-31 23:59:59'),
  ('SAVE500', 'Get ₦500 off orders above ₦5000', 'fixed', 500, 5000, NULL, 1000, '2026-12-31 23:59:59'),
  ('FLASH20', 'Flash sale - 20% off (limited time)', 'percentage', 20, 2000, 1000, 500, '2026-02-28 23:59:59'),
  ('LOYALTY15', 'Loyalty reward - 15% off', 'percentage', 15, 1500, 750, NULL, '2026-12-31 23:59:59')
ON CONFLICT (code) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON promo_codes TO authenticated;
GRANT SELECT, INSERT ON promo_code_usage TO authenticated;
GRANT EXECUTE ON FUNCTION validate_promo_code TO authenticated;
GRANT EXECUTE ON FUNCTION record_promo_usage TO authenticated;
