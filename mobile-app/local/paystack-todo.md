# Paystack Integration TODO

## ✅ Current Status

- [x] Database migration created (`20251204_paystack_integration.sql`)
- [x] Frontend payment modal exists
- [x] Edge functions created (but need fixes)

## 🔴 Critical Fixes Needed

### 1. Fix paystack-create-dva Edge Function

**Issue:** Missing error handling, no logging
**Files:** `supabase/functions/paystack-create-dva/index.ts`

- [ ] Add comprehensive logging
- [ ] Validate environment variables
- [ ] Check Paystack API response status
- [ ] Handle customer already exists case
- [ ] Use `test-bank` for test mode

### 2. Fix paystack-webhook Edge Function

**Issue:** Listening to WRONG event for virtual accounts
**Files:** `supabase/functions/paystack-webhook/index.ts`

- [ ] Change from `transfer.success` to `charge.success`
- [ ] Detect virtual account payments by `channel === 'dedicated_nuban'`
- [ ] Match payment to user via virtual_accounts table
- [ ] Verify webhook signature properly
- [ ] Log all webhook events for debugging

### 3. Deploy Updated Functions

```bash
npx supabase functions deploy paystack-create-dva
npx supabase functions deploy paystack-webhook
```

### 4. Set Paystack Secret

```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_2aa6fb01cacd46ad2db6900bf1225a9081c0d5b8
```

### 5. Configure Webhook in Paystack Dashboard

- [ ] Go to https://dashboard.paystack.com/settings/developer
- [ ] Add webhook URL: `https://aoqndrpwcvnwamvpvjsx.supabase.co/functions/v1/paystack-webhook`
- [ ] Enable `charge.success` event
- [ ] Copy webhook secret for verification

## 📋 Understanding the Flow

### Virtual Account (DVA) Payment Flow:

```
1. User clicks "Create Virtual Account"
   ↓
2. Frontend calls paystack-create-dva edge function
   ↓
3. Edge function:
   - Creates Paystack customer
   - Creates DVA (use test-bank for test mode)
   - Saves to virtual_accounts table
   ↓
4. User gets account number (e.g., 9876543210)
   ↓
5. User transfers ₦5000 to that account
   ↓
6. Paystack receives transfer and sends webhook:
   {
     "event": "charge.success",
     "data": {
       "channel": "dedicated_nuban",
       "amount": 500000, // in kobo
       "customer": { ... },
       "authorization": {
         "channel": "dedicated_nuban",
         "bank": "Wema Bank",
         ...
       }
     }
   }
   ↓
7. Webhook handler:
   - Verifies signature
   - Checks channel === 'dedicated_nuban'
   - Finds user by account number
   - Records payment in payments table
   - Money goes to YOUR Paystack settlement account
```

### Card Payment Flow:

```
1. User clicks "Pay with Card"
   ↓
2. Frontend calls paystack-initialize
   ↓
3. Opens Paystack checkout with authorization_url
   ↓
4. User enters card details on Paystack
   ↓
5. Paystack processes payment
   ↓
6. Webhook receives charge.success:
   {
     "event": "charge.success",
     "data": {
       "channel": "card",
       "amount": 500000,
       "authorization": {
         "channel": "card",
         "authorization_code": "AUTH_xxx", // for saving card
         ...
       }
     }
   }
   ↓
7. Record payment in database
```

## ⚠️ Important Notes

### You DON'T Need a Wallet Table Because:

1. Paystack settles money directly to YOUR bank account
2. Users aren't "storing" money in your app
3. You're just tracking who paid and how much
4. The `payments` table IS your transaction ledger

### If You Want User Balances (Optional):

Only create wallets if you want users to:

- Store credits for later use
- Have a balance they can spend from
- Get refunds as credits instead of bank transfers

For simple payment tracking, `payments` table is enough!

## 🧪 Testing

### Test Virtual Account Creation:

1. In `paystack-create-dva`, use `preferred_bank: 'test-bank'`
2. Account will be created instantly
3. Use Paystack Demo Bank to test transfers: https://demobank.paystackintegrations.com/

### Test Webhook Locally:

```bash
# Terminal 1: Start Supabase functions
npx supabase functions serve

# Terminal 2: Forward webhooks to local
# (Use ngrok or similar)
```

## 📚 Next Steps After Fixes

1. [ ] Test DVA creation in test mode
2. [ ] Test transfer using Paystack demo bank
3. [ ] Verify webhook receives charge.success
4. [ ] Check payment recorded in database
5. [ ] Go live (requires KYC completion)
6. [ ] Update to live keys
7. [ ] Use real banks (wema-bank, titan-paystack)

## 🔗 References

- Paystack DVA Docs: https://paystack.com/docs/payments/dedicated-virtual-accounts
- Webhook Events: https://paystack.com/docs/payments/webhooks/
- Demo Bank: https://demobank.paystackintegrations.com/
