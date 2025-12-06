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