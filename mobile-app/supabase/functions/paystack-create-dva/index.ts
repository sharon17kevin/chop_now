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