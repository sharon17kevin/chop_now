# Wallet Funding System - Complete Guide

## Overview

This wallet system allows users to:

1. Transfer money to their dedicated virtual account via bank transfer
2. Receive the funds automatically in their in-app wallet
3. Use their wallet balance to make purchases
4. View complete transaction history

## System Architecture

### Database Tables

#### 1. `wallets` table

- Stores user wallet balances
- One wallet per user (user_id is unique)
- Balance has CHECK constraint (balance >= 0) to prevent negative balances
- Tracks last credited/debited timestamps

#### 2. `wallet_transactions` table

- Complete audit trail of all wallet operations
- Records: type (credit/debit), amount, balance before/after, description, reference
- Cannot be modified after creation (immutable audit log)

### Database Functions

#### `credit_wallet(p_user_id, p_amount, p_description, p_reference)`

- Creates wallet if it doesn't exist
- Adds amount to balance atomically
- Records transaction in wallet_transactions
- Returns: `{ success: true, new_balance: 1500.00, message: "..." }`

#### `debit_wallet(p_user_id, p_amount, p_description, p_reference)`

- Checks if sufficient balance exists
- Deducts amount if balance is sufficient
- Records transaction in wallet_transactions
- Returns: `{ success: true/false, new_balance: 500.00, message: "..." }`

#### `get_wallet_balance(p_user_id)`

- Helper function to query current balance
- Returns balance as numeric value

## Payment Flow

### When User Transfers Money

```
1. User transfers ₦1,000 to their virtual account (e.g., 9123456789 - Wema Bank)
                          ↓
2. Paystack receives the transfer and sends webhook to your edge function
   Event: charge.success
   Channel: dedicated_nuban (identifies it as virtual account deposit)
   Authorization: { receiver_bank_account_number: "9123456789" }
                          ↓
3. Webhook function (paystack-webhook):
   a) Verifies webhook signature
   b) Detects channel === "dedicated_nuban"
   c) Looks up user by account_number in virtual_accounts table
   d) Records payment in payments table
   e) Calls credit_wallet() to add ₦1,000 to user's balance
                          ↓
4. User's wallet balance increases from ₦0 → ₦1,000
   Transaction recorded in wallet_transactions:
   - Type: credit
   - Amount: 1000.00
   - Balance before: 0.00
   - Balance after: 1000.00
   - Description: "Deposit via virtual_account"
   - Reference: [Paystack reference]
```

### When User Makes Purchase

```
1. User initiates purchase (e.g., ₦500 order)
                          ↓
2. Your app calls debit_wallet:

   const { data } = await supabase.rpc('debit_wallet', {
     p_user_id: userId,
     p_amount: 500,
     p_description: 'Order #12345',
     p_reference: 'order_12345'
   })
                          ↓
3. debit_wallet function:
   a) Checks if balance >= 500 (sufficient funds)
   b) If yes: deducts 500, records transaction, returns success
   c) If no: returns failure with "Insufficient balance" message
                          ↓
4. If successful:
   - Wallet balance decreases: ₦1,000 → ₦500
   - Transaction recorded in wallet_transactions:
     * Type: debit
     * Amount: 500.00
     * Balance before: 1000.00
     * Balance after: 500.00
     * Description: "Order #12345"
     * Reference: "order_12345"
```

## Security Features

### 1. Row Level Security (RLS)

```sql
-- Users can only view their own wallet
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System can modify all wallets (for credit_wallet/debit_wallet functions)
CREATE POLICY "System can modify wallets"
  ON wallets FOR ALL
  TO service_role
  USING (true);
```

### 2. Database Constraints

- `balance >= 0` prevents negative balances at database level
- `user_id UNIQUE` ensures one wallet per user
- Foreign keys ensure data integrity

### 3. Atomic Operations

- All wallet operations use PostgreSQL functions with transactions
- No race conditions - balance updates are atomic
- If any step fails, entire transaction rolls back

## Deployment Steps

### 1. Deploy Database Migration

```powershell
cd mobile-app
npx supabase db push
```

This creates:

- wallets table
- wallet_transactions table
- credit_wallet() function
- debit_wallet() function
- get_wallet_balance() function
- RLS policies
- Indexes

### 2. Deploy Edge Functions

```powershell
npx supabase functions deploy paystack-webhook
```

### 3. Set Paystack Secret

```powershell
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_YOUR_KEY
```

### 4. Configure Webhook

1. Go to: https://dashboard.paystack.com/#/settings/webhooks
2. Get webhook URL: `npx supabase functions list`
3. Add webhook with URL from step 2
4. Enable event: `charge.success`

## Testing

### Test Virtual Account Payment

1. Create virtual account in your app
2. Note the account number (e.g., 9123456789)
3. Go to: https://demobank.paystackintegrations.com/
4. Transfer ₦1,000 to that account
5. Check logs: `npx supabase functions logs paystack-webhook`
6. Verify wallet credited:

```sql
SELECT * FROM wallets WHERE user_id = 'USER_ID';
SELECT * FROM wallet_transactions WHERE user_id = 'USER_ID' ORDER BY created_at DESC;
```

### Test Purchase Flow

```typescript
// In your app when user makes purchase
const { data, error } = await supabase.rpc('debit_wallet', {
  p_user_id: userId,
  p_amount: orderTotal,
  p_description: `Order #${orderId}`,
  p_reference: `order_${orderId}`,
});

if (data?.success) {
  console.log('Payment successful! New balance:', data.new_balance);
  // Complete order
} else {
  console.error('Payment failed:', data?.message);
  // Show error: "Insufficient balance"
}
```

## Frontend Integration

### 1. Display Wallet Balance

```typescript
const { data: balance } = await supabase.rpc('get_wallet_balance', {
  p_user_id: userId,
});

console.log(`Wallet Balance: ₦${balance}`);
```

### 2. Display Transaction History

```typescript
const { data: transactions } = await supabase
  .from('wallet_transactions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);

transactions.forEach((tx) => {
  console.log(
    `${tx.type === 'credit' ? '+' : '-'}₦${tx.amount} - ${tx.description}`
  );
});
```

### 3. Fund Wallet

Direct user to their virtual account details (already created via paystack-create-dva):

```typescript
const { data: account } = await supabase
  .from('virtual_accounts')
  .select('*')
  .eq('user_id', userId)
  .single();

// Show to user:
// Bank: Wema Bank
// Account Number: ${account.account_number}
// Account Name: ${account.account_name}
```

## Logging & Monitoring

### Check Webhook Logs

```powershell
npx supabase functions logs paystack-webhook --tail
```

Look for:

- 🔔 Webhook received
- ✅ Signature verified
- 💰 Charge success event received
- 🏛️ Virtual account payment detected
- ✅ Found user
- 💵 Amount: ₦X
- 💾 Recording payment...
- ✅ Payment recorded successfully
- 💳 Crediting wallet...
- ✅ Wallet credited: ₦X | New balance: ₦Y

## Common Issues

### Issue: Wallet not credited after transfer

**Diagnosis:**

```sql
-- Check if payment was recorded
SELECT * FROM payments WHERE reference = 'PAYSTACK_REFERENCE';

-- Check webhook logs
-- npx supabase functions logs paystack-webhook
```

**Possible causes:**

1. Webhook not configured in Paystack dashboard
2. Wrong event type (must be `charge.success`)
3. User not found by account number
4. Database function error

### Issue: Debit fails with "Insufficient balance"

**Diagnosis:**

```sql
-- Check actual balance
SELECT * FROM wallets WHERE user_id = 'USER_ID';

-- Check recent transactions
SELECT * FROM wallet_transactions
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC LIMIT 10;
```

**Solution:** User needs to fund wallet via bank transfer

### Issue: Duplicate transactions

**Prevention:** The system uses Paystack's reference as unique identifier

- Each payment reference is unique
- Duplicate webhooks won't create duplicate wallet transactions
- Reference field prevents re-processing same payment

## Performance Considerations

### Indexes

The migration creates indexes on:

- `wallets.user_id` - Fast wallet lookups
- `wallet_transactions.user_id` - Fast transaction history queries
- `wallet_transactions.wallet_id` - Efficient joins
- `wallet_transactions.reference` - Quick reference lookups

### Query Optimization

```sql
-- Good: Uses index on user_id
SELECT balance FROM wallets WHERE user_id = 'USER_ID';

-- Good: Uses index and limit
SELECT * FROM wallet_transactions
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC LIMIT 50;

-- Good: Use RPC function (optimized)
SELECT credit_wallet('USER_ID', 1000, 'Deposit', 'ref_123');
```

## Next Steps

1. ✅ Deploy migration - `npx supabase db push`
2. ✅ Deploy edge functions - `npx supabase functions deploy paystack-webhook`
3. ⏳ Set Paystack secret - `npx supabase secrets set PAYSTACK_SECRET_KEY=...`
4. ⏳ Configure webhook URL in Paystack dashboard
5. ⏳ Test deposit flow with demo bank
6. ⏳ Implement frontend UI for wallet balance display
7. ⏳ Implement purchase flow using debit_wallet
8. ⏳ Add transaction history view
9. ⏳ Add low balance notifications
10. ⏳ Test production flow with real bank account

---

**Questions?** Check the logs with `npx supabase functions logs paystack-webhook --tail`
