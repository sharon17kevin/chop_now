# Paystack Integration Implementation Guide

## Overview
This integration adds 3 payment methods to your app:
1. **Card Payment** - Pay with debit/credit cards (can be saved)
2. **Bank Transfer** - One-time bank transfer payments
3. **Dedicated Virtual Account** - Permanent account number per user

## Files Created

### 1. Database Migration
- `supabase/migrations/20251204_paystack_integration.sql`
  - Creates `virtual_accounts` table
  - Creates `payments` table  
  - Updates `payment_methods` table with Paystack fields
  - Adds RLS policies and indexes

### 2. Frontend Files
- `lib/paystack.ts` - Service layer for Paystack operations
- `components/PaystackPaymentModal.tsx` - Payment modal component

## Next Steps

### Step 1: Run Database Migration
```bash
npx supabase db push
```

### Step 2: Add Environment Variables
Add to your `.env` file:
```
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

Get your keys from: https://dashboard.paystack.com/#/settings/developers

### Step 3: Create Supabase Edge Functions

You need to create 4 Edge Functions in `supabase/functions/`:

#### A. paystack-initialize/index.ts
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

serve(async (req) => {
  const { email, amount, reference, channels, metadata } = await req.json()

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount, // already in kobo from frontend
        reference: reference || `txn_${Date.now()}`,
        channels: channels || ['card', 'bank', 'ussd', 'qr', 'bank_transfer'],
        metadata: metadata || {},
      }),
    })

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

#### B. paystack-verify/index.ts
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

serve(async (req) => {
  const { reference } = await req.json()

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    })

    const data = await response.json()

    if (data.status && data.data.status === 'success') {
      // Save to database
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const authorization = data.data.authorization
      
      // Save payment record
      await supabase.from('payments').insert({
        user_id: data.data.metadata.user_id,
        reference: data.data.reference,
        amount: data.data.amount / 100,
        currency: data.data.currency,
        status: 'success',
        payment_method: data.data.channel,
        paystack_reference: data.data.reference,
        authorization_code: authorization?.authorization_code,
        metadata: data.data.metadata,
        verified_at: new Date().toISOString(),
      })

      // If card payment, save card details
      if (authorization && authorization.authorization_code) {
        await supabase.from('payment_methods').upsert({
          user_id: data.data.metadata.user_id,
          type: 'card',
          card_last_four: authorization.last4,
          card_brand: authorization.brand,
          card_exp_month: parseInt(authorization.exp_month),
          card_exp_year: parseInt(authorization.exp_year),
          authorization_code: authorization.authorization_code,
          payment_provider: 'paystack',
          is_default: false,
          is_active: true,
        })
      }
    }
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

#### C. paystack-create-dva/index.ts
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

serve(async (req) => {
  const { userId, email } = await req.json()

  try {
    // Create customer first
    const customerRes = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const customerData = await customerRes.json()
    const customerCode = customerData.data.customer_code

    // Create dedicated virtual account
    const dvaRes = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: customerCode,
        preferred_bank: 'wema-bank', // or 'titan-paystack'
      }),
    })

    const dvaData = await dvaRes.json()

    // Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase.from('virtual_accounts').upsert({
      user_id: userId,
      account_number: dvaData.data.account_number,
      account_name: dvaData.data.account_name,
      bank_name: dvaData.data.bank.name,
      bank_code: dvaData.data.bank.id,
      paystack_customer_code: customerCode,
      paystack_account_id: dvaData.data.id,
      is_active: true,
    })
    
    return new Response(JSON.stringify({ data: dvaData.data }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

#### D. paystack-webhook/index.ts
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

serve(async (req) => {
  const signature = req.headers.get('x-paystack-signature')
  const body = await req.text()
  
  // Verify webhook signature
  const hash = createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex')
    
  if (hash !== signature) {
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(body)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Handle different event types
  if (event.event === 'charge.success') {
    // Payment successful
    await supabase.from('payments').upsert({
      reference: event.data.reference,
      status: 'success',
      verified_at: new Date().toISOString(),
    })
  } else if (event.event === 'transfer.success' || event.event === 'transfer.failed') {
    // Handle transfer events for virtual account
    await supabase.from('payments').insert({
      user_id: event.data.metadata?.user_id,
      reference: event.data.reference,
      amount: event.data.amount / 100,
      status: event.event === 'transfer.success' ? 'success' : 'failed',
      payment_method: 'virtual_account',
      paystack_reference: event.data.reference,
      metadata: event.data.metadata,
      verified_at: new Date().toISOString(),
    })
  }

  return new Response('OK', { status: 200 })
})
```

### Step 4: Deploy Edge Functions
```bash
npx supabase functions deploy paystack-initialize
npx supabase functions deploy paystack-verify
npx supabase functions deploy paystack-create-dva
npx supabase functions deploy paystack-webhook
```

### Step 5: Set Paystack Secret in Supabase
```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

### Step 6: Update payment.tsx

The payment screen needs to be updated to include:
- PaystackPaymentModal import and state
- Button to add new card via Paystack
- Button to navigate to virtual account screen  
- Button for bank transfer option

### Step 7: Create Virtual Account Screen
Create `app/(tabs)/(profile)/virtualAccount.tsx` (code provided in implementation guide)

### Step 8: Configure Webhooks in Paystack Dashboard
1. Go to https://dashboard.paystack.com/#/settings/webhooks
2. Add your webhook URL: `https://[project-ref].supabase.co/functions/v1/paystack-webhook`
3. Enable events: charge.success, transfer.success, transfer.failed

## Usage Flow

### Card Payment Flow:
1. User clicks "Add Payment Method"
2. PaystackPaymentModal opens
3. User enters card details
4. On success, card is saved with authorization_code
5. User can charge saved cards for future payments

### Bank Transfer Flow:
1. User initiates payment
2. Temporary account number generated
3. User transfers to that account
4. Webhook confirms payment
5. Account expires after use

### Dedicated Virtual Account Flow:
1. User navigates to Virtual Account screen
2. One-time account creation
3. Account is permanent for that user
4. Any transfer to this account auto-credits wallet
5. Webhook handles automatic confirmation

## Security Notes
- Never expose PAYSTACK_SECRET_KEY in frontend
- Always verify payments on backend
- Use webhook signatures to verify authenticity
- Store only authorization codes, never full card details
- Enable HTTPS for all API calls

## Testing
Use Paystack test cards: https://paystack.com/docs/payments/test-payments
- Success: 4084084084084081
- Declined: 4084080000000408
