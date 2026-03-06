-- ============================================================================
-- WALLET SYSTEM
-- ============================================================================
-- Created: March 3, 2026
-- Purpose: Create wallet tables for vendor earnings and customer balances
-- ============================================================================
-- Note: This migration consolidates wallet functionality from legacy migrations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE WALLETS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  currency TEXT DEFAULT 'NGN',
  last_credited_at TIMESTAMPTZ,
  last_debited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comments
COMMENT ON TABLE wallets IS 'User wallet balances - single source of truth for withdrawable funds';
COMMENT ON COLUMN wallets.balance IS 'Current available balance (credited when escrow releases)';
COMMENT ON COLUMN wallets.last_credited_at IS 'Timestamp of last credit (e.g., escrow release, refund)';
COMMENT ON COLUMN wallets.last_debited_at IS 'Timestamp of last debit (e.g., purchase, withdrawal)';

-- ----------------------------------------------------------------------------
-- 2. CREATE WALLET TRANSACTIONS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  balance_before NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2) NOT NULL,
  description TEXT,
  reference TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comments
COMMENT ON TABLE wallet_transactions IS 'Immutable audit trail of all wallet credits and debits';
COMMENT ON COLUMN wallet_transactions.type IS 'credit: money added (escrow_release, refund) | debit: money removed (withdrawal, purchase)';
COMMENT ON COLUMN wallet_transactions.reference IS 'Unique reference for idempotency (e.g., escrow_release_ORDER_ID)';
COMMENT ON COLUMN wallet_transactions.metadata IS 'Additional context (order_id, refund_id, etc.)';

-- ----------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Wallets: Users can view their own wallet, system can modify all
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (true);

-- Wallet Transactions: Users can view their own transactions, system creates transactions
CREATE POLICY "Users can view own wallet transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet transactions"
  ON wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. FUNCTION: CREDIT WALLET
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Wallet credit',
  p_reference TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_result JSON;
BEGIN
  -- Get or create wallet
  INSERT INTO wallets (user_id, balance)
  VALUES (p_user_id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get wallet details with lock to prevent race conditions
  SELECT id, balance INTO v_wallet_id, v_balance_before
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_wallet_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Wallet not found after creation'
    );
  END IF;
  
  -- Update balance
  UPDATE wallets
  SET balance = balance + p_amount,
      last_credited_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_balance_after;
  
  -- Record transaction
  INSERT INTO wallet_transactions (
    wallet_id, user_id, type, amount, 
    balance_before, balance_after, description, reference
  ) VALUES (
    v_wallet_id, p_user_id, 'credit', p_amount,
    v_balance_before, v_balance_after, p_description, p_reference
  );
  
  v_result := json_build_object(
    'success', true,
    'new_balance', v_balance_after,
    'amount_credited', p_amount,
    'message', 'Wallet credited successfully'
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION credit_wallet IS 'Credits user wallet atomically - used by escrow release, refunds, deposits';

-- ----------------------------------------------------------------------------
-- 6. FUNCTION: DEBIT WALLET
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Wallet debit',
  p_reference TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_result JSON;
BEGIN
  -- Get wallet with lock
  SELECT id, balance INTO v_wallet_id, v_balance_before
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_wallet_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Wallet not found'
    );
  END IF;
  
  -- Check sufficient balance
  IF v_balance_before < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Insufficient balance',
      'current_balance', v_balance_before,
      'required', p_amount
    );
  END IF;
  
  -- Update balance
  UPDATE wallets
  SET balance = balance - p_amount,
      last_debited_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_balance_after;
  
  -- Record transaction
  INSERT INTO wallet_transactions (
    wallet_id, user_id, type, amount,
    balance_before, balance_after, description, reference
  ) VALUES (
    v_wallet_id, p_user_id, 'debit', p_amount,
    v_balance_before, v_balance_after, p_description, p_reference
  );
  
  v_result := json_build_object(
    'success', true,
    'new_balance', v_balance_after,
    'amount_debited', p_amount,
    'message', 'Wallet debited successfully'
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION debit_wallet IS 'Debits user wallet with balance check - used for withdrawals, purchases';

-- ----------------------------------------------------------------------------
-- 7. FUNCTION: GET WALLET BALANCE
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT balance INTO v_balance
  FROM wallets
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_wallet_balance IS 'Gets current wallet balance for a user (returns 0 if wallet does not exist)';

-- ----------------------------------------------------------------------------
-- 8. TRIGGERS FOR UPDATED_AT
-- ----------------------------------------------------------------------------

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: update_updated_at_column() function should already exist from earlier migrations

-- ============================================================================
-- END OF WALLET SYSTEM MIGRATION
-- ============================================================================
