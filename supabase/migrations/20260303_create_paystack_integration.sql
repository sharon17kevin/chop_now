-- ============================================================================
-- PAYSTACK INTEGRATION SYSTEM
-- ============================================================================
-- Created: March 3, 2026
-- Purpose: Create tables and functions for Paystack payment integration
-- Features: Virtual accounts (DVA), payment tracking, transaction history
-- ============================================================================
-- Dependencies: wallets and wallet_transactions tables must exist
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE VIRTUAL ACCOUNTS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS virtual_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  paystack_customer_code TEXT,
  paystack_account_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Comments
COMMENT ON TABLE virtual_accounts IS 'Stores Paystack Dedicated Virtual Account (DVA) details for users';
COMMENT ON COLUMN virtual_accounts.account_number IS 'Virtual account number assigned by Paystack (e.g., 9123456789)';
COMMENT ON COLUMN virtual_accounts.bank_name IS 'Bank name for the virtual account (e.g., Wema Bank)';
COMMENT ON COLUMN virtual_accounts.paystack_customer_code IS 'Paystack customer identifier for API calls';
COMMENT ON COLUMN virtual_accounts.is_active IS 'Whether this virtual account is active and can receive payments';

-- ----------------------------------------------------------------------------
-- 2. CREATE PAYMENTS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_method TEXT NOT NULL,
  paystack_reference TEXT,
  authorization_code TEXT,
  metadata JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comments
COMMENT ON TABLE payments IS 'Tracks all payment transactions through Paystack (cards, transfers, virtual accounts)';
COMMENT ON COLUMN payments.reference IS 'Unique payment reference from Paystack (e.g., trx_abc123xyzdef)';
COMMENT ON COLUMN payments.payment_method IS 'Payment channel: card, bank_transfer, virtual_account, ussd, etc.';
COMMENT ON COLUMN payments.authorization_code IS 'Paystack authorization code for recurring card charges';
COMMENT ON COLUMN payments.metadata IS 'Custom metadata sent from frontend (order_id, user info, etc.)';
COMMENT ON COLUMN payments.verified_at IS 'Timestamp when payment was verified by webhook or frontend';

-- ----------------------------------------------------------------------------
-- 3. UPDATE PAYMENT_METHODS TABLE (IF EXISTS)
-- ----------------------------------------------------------------------------

-- Add Paystack-specific fields to payment_methods table
-- This table should already exist from earlier Profile Tab migration
ALTER TABLE IF EXISTS payment_methods 
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_customer_id TEXT,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

COMMENT ON COLUMN payment_methods.authorization_code IS 'Paystack authorization code for charging saved cards (recurring payments)';
COMMENT ON COLUMN payment_methods.paystack_customer_id IS 'Paystack customer ID for this payment method';
COMMENT ON COLUMN payment_methods.last_used_at IS 'Timestamp of last successful charge using this payment method';

-- ----------------------------------------------------------------------------
-- 4. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------

-- Virtual Accounts
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_user_id ON virtual_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_account_number ON virtual_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_is_active ON virtual_accounts(is_active) WHERE is_active = true;

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);

-- Payment Methods (if table exists)
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE virtual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own virtual account" ON virtual_accounts;
DROP POLICY IF EXISTS "Users can insert own virtual account" ON virtual_accounts;
DROP POLICY IF EXISTS "Users can update own virtual account" ON virtual_accounts;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;

-- Virtual Accounts: Users can only access their own account
CREATE POLICY "Users can view own virtual account"
  ON virtual_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own virtual account"
  ON virtual_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual account"
  ON virtual_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Payments: Users can only access their own payment records
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS FOR UPDATED_AT
-- ----------------------------------------------------------------------------

-- Drop existing triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS update_virtual_accounts_updated_at ON virtual_accounts;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;

-- Virtual Accounts trigger
CREATE TRIGGER update_virtual_accounts_updated_at
  BEFORE UPDATE ON virtual_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Payments trigger
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: update_updated_at_column() function should already exist from wallet migration
-- If not, it needs to be created

-- ----------------------------------------------------------------------------
-- 7. HELPER FUNCTION: GET USER PAYMENT HISTORY
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_user_payment_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  reference TEXT,
  amount NUMERIC,
  payment_method TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.reference,
    p.amount,
    p.payment_method,
    p.status,
    p.created_at
  FROM payments p
  WHERE p.user_id = p_user_id
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_payment_history IS 'Retrieves user payment history (recent transactions)';

-- ----------------------------------------------------------------------------
-- 8. HELPER FUNCTION: GET VIRTUAL ACCOUNT DETAILS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_user_virtual_account(p_user_id UUID)
RETURNS TABLE (
  account_number TEXT,
  account_name TEXT,
  bank_name TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    va.account_number,
    va.account_name,
    va.bank_name,
    va.is_active
  FROM virtual_accounts va
  WHERE va.user_id = p_user_id
  AND va.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_virtual_account IS 'Retrieves active virtual account for a user';

-- ----------------------------------------------------------------------------
-- 9. ANALYTICS FUNCTION: PAYMENT STATS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_payment_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_payments', COUNT(*),
    'successful_payments', COUNT(*) FILTER (WHERE status = 'success'),
    'failed_payments', COUNT(*) FILTER (WHERE status = 'failed'),
    'total_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0),
    'last_payment_date', MAX(created_at) FILTER (WHERE status = 'success')
  ) INTO v_result
  FROM payments
  WHERE user_id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_payment_stats IS 'Returns payment statistics for a user (count, totals, success rate)';

-- ============================================================================
-- END OF PAYSTACK INTEGRATION MIGRATION
-- ============================================================================

-- Post-migration verification queries (run manually to verify):
/*

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('virtual_accounts', 'payments');

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('virtual_accounts', 'payments');

-- Check indexes were created
SELECT indexname, tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('virtual_accounts', 'payments')
ORDER BY tablename, indexname;

-- Check functions were created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_payment_history', 'get_user_virtual_account', 'get_payment_stats');

-- Test virtual account creation (replace with actual user_id)
INSERT INTO virtual_accounts (user_id, account_number, account_name, bank_name, bank_code)
VALUES ('YOUR_USER_ID', '9876543210', 'Test User', 'Wema Bank', '035');

-- Test payment recording (replace with actual user_id)
INSERT INTO payments (user_id, reference, amount, payment_method, status)
VALUES ('YOUR_USER_ID', 'test_payment_001', 1000.00, 'virtual_account', 'success');

*/
