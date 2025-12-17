# Paystack Integration - What Changed

## Summary

Fixed critical bugs in Paystack virtual account integration based on official Paystack documentation.

## Key Problems Fixed

### 1. ❌ WRONG: Webhook Listening to `transfer.success`

**Problem:** Virtual account deposits don't trigger `transfer.success` events.

**Correct:** Paystack sends `charge.success` with `channel: "dedicated_nuban"` for virtual account transfers.

```typescript
// BEFORE (Wrong)
if (event.event === 'transfer.success') {
  // This NEVER fires for virtual account deposits!
}

// AFTER (Correct)
if (event.event === 'charge.success') {
  const channel = data.authorization?.channel;
  if (channel === 'dedicated_nuban') {
    // Virtual account payment!
  }
}
```

### 2. ❌ MISSING: Error Handling in DVA Creation

**Problem:** Edge function crashed silently without logging what went wrong.

**Fixed:**

- ✅ Validate environment variables
- ✅ Check Paystack API responses
- ✅ Log each step with emojis for easy debugging
- ✅ Check if user already has account (avoid duplicates)
- ✅ Auto-detect test mode and use `test-bank`

### 3. ❌ MISSING: User Lookup for Virtual Account Payments

**Problem:** Webhook didn't know which user to credit when payment arrived.

**Fixed:** Look up user by account number from `virtual_accounts` table:

```typescript
const { data: account } = await supabase
  .from('virtual_accounts')
  .select('user_id')
  .eq('account_number', data.authorization?.sender_bank_account_number)
  .single();
```

## Files Changed

### 1. `supabase/functions/paystack-create-dva/index.ts`

**Changes:**

- Added comprehensive logging (🚀 🏦 ✅ ❌ emojis)
- Validate all environment variables
- Check if user already has virtual account
- Auto-detect test mode: `sk_test_` → use `test-bank`
- Proper error handling with status codes
- CORS headers for frontend calls

**Test it:**

```bash
# Deploy
npx supabase functions deploy paystack-create-dva

# Check logs
npx supabase functions logs paystack-create-dva --tail
```

### 2. `supabase/functions/paystack-webhook/index.ts`

**Changes:**

- **CRITICAL:** Changed from `transfer.success` to `charge.success`
- Detect virtual account via `channel === 'dedicated_nuban'`
- Find user by account number lookup
- Save all payment details properly
- Convert kobo to naira (`amount / 100`)
- Added comprehensive logging

**Set up webhook:**

1. Go to https://dashboard.paystack.com/settings/developer
2. Add URL: `https://aoqndrpwcvnwamvpvjsx.supabase.co/functions/v1/paystack-webhook`
3. Enable `charge.success` event
4. Copy webhook secret

**Test it:**

```bash
# Deploy
npx supabase functions deploy paystack-webhook

# Check logs
npx supabase functions logs paystack-webhook --tail
```

### 3. `local/paystack-todo.md` (NEW)

Complete checklist with testing instructions.

## Next Steps

### 1. Deploy Functions

```bash
npx supabase functions deploy paystack-create-dva
npx supabase functions deploy paystack-webhook
```

### 2. Set Secret Key

```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_2aa6fb01cacd46ad2db6900bf1225a9081c0d5b8
```

### 3. Configure Webhook in Paystack

- URL: `https://aoqndrpwcvnwamvpvjsx.supabase.co/functions/v1/paystack-webhook`
- Event: `charge.success`

### 4. Test Virtual Account Creation

1. Open app → Profile → Virtual Account
2. Click "Create Virtual Account"
3. Check logs: `npx supabase functions logs paystack-create-dva --tail`
4. Should see: ✅ DVA created successfully!

### 5. Test Payment

1. Use Paystack Demo Bank: https://demobank.paystackintegrations.com/
2. Transfer ₦5000 to your virtual account number
3. Check webhook logs: `npx supabase functions logs paystack-webhook --tail`
4. Should see: ✅ Payment recorded successfully
5. Check database: `payments` table should have new record

## Important Notes

### You DON'T Need a Wallet Table ❌

**Why?**

- Paystack settles money to YOUR bank account
- You're just tracking who paid
- `payments` table is your transaction ledger

### Only Create Wallets If You Need:

- User balance/credits system
- Store money for later purchases
- Refunds as credits instead of bank transfers

## How Virtual Accounts Actually Work

```
User transfers ₦5000 to virtual account
         ↓
Paystack receives it
         ↓
Sends webhook: charge.success with channel=dedicated_nuban
         ↓
Your webhook records payment in database
         ↓
Money settles to YOUR Paystack account
         ↓
Paystack transfers to YOUR bank (T+1)
```

**You're NOT storing user money - you're tracking who paid you!**

## Testing Checklist

- [ ] Deploy both functions
- [ ] Set PAYSTACK_SECRET_KEY
- [ ] Configure webhook in Paystack dashboard
- [ ] Create virtual account in app
- [ ] Transfer money using demo bank
- [ ] Verify payment in database
- [ ] Check all logs for errors

## References

- Paystack DVA Docs: https://paystack.com/docs/payments/dedicated-virtual-accounts
- Demo Bank: https://demobank.paystackintegrations.com/
- Webhook Events: https://paystack.com/docs/payments/webhooks/
