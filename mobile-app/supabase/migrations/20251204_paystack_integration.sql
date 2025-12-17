-- Create virtual_accounts table for dedicated accounts
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Create payments table for transaction tracking
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending', -- pending, success, failed
  payment_method TEXT NOT NULL, -- card, transfer, virtual_account
  paystack_reference TEXT,
  authorization_code TEXT, -- For saved cards
  metadata JSONB,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create wallets table for user balances
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  currency TEXT DEFAULT 'NGN',
  last_credited_at TIMESTAMP WITH TIME ZONE,
  last_debited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create wallet_transactions table for audit trail
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update payment_methods table to include Paystack fields
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_customer_id TEXT,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE virtual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for virtual_accounts
CREATE POLICY "Users can view own virtual account"
  ON virtual_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own virtual account"
  ON virtual_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual account"
  ON virtual_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for wallets
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallets"
  ON wallets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update wallets"
  ON wallets FOR UPDATE
  USING (true);

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_user_id ON virtual_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to credit wallet (called by webhook when user pays)
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT 'Wallet top-up',
  p_reference TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_before DECIMAL;
  v_balance_after DECIMAL;
  v_result JSON;
BEGIN
  -- Get or create wallet
  INSERT INTO wallets (user_id, balance)
  VALUES (p_user_id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get wallet details
  SELECT id, balance INTO v_wallet_id, v_balance_before
  FROM wallets
  WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Wallet not found'
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

-- Function to debit wallet (called when user makes purchase)
CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT 'Purchase',
  p_reference TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_before DECIMAL;
  v_balance_after DECIMAL;
  v_result JSON;
BEGIN
  -- Get wallet
  SELECT id, balance INTO v_wallet_id, v_balance_before
  FROM wallets
  WHERE user_id = p_user_id;
  
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

-- Function to get wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT balance INTO v_balance
  FROM wallets
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER update_virtual_accounts_updated_at
  BEFORE UPDATE ON virtual_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE virtual_accounts IS 'Stores dedicated virtual account details for users';
COMMENT ON TABLE payments IS 'Tracks all payment transactions through Paystack';
COMMENT ON TABLE wallets IS 'User wallet balances for in-app transactions';
COMMENT ON TABLE wallet_transactions IS 'Audit trail of all wallet credits and debits';
COMMENT ON COLUMN payment_methods.authorization_code IS 'Paystack authorization code for charging saved cards';
COMMENT ON FUNCTION credit_wallet IS 'Credits user wallet and creates transaction record';
COMMENT ON FUNCTION debit_wallet IS 'Debits user wallet with balance check and creates transaction record';
COMMENT ON FUNCTION get_wallet_balance IS 'Gets current wallet balance for a user';
