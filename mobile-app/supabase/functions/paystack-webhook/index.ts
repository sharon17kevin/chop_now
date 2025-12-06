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