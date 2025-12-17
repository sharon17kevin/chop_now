import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

serve(async (req) => {
  console.log('🔔 Webhook received')
  
  const signature = req.headers.get('x-paystack-signature')
  const body = await req.text()
  
  console.log('Signature:', signature ? 'Present' : 'Missing')
  
  // Verify webhook signature
  const hash = createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex')
    
  if (hash !== signature) {
    console.error('❌ Invalid signature')
    return new Response('Invalid signature', { status: 400 })
  }
  
  console.log('✅ Signature verified')

  const event = JSON.parse(body)
  console.log('Event type:', event.event)
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Handle charge.success event (for ALL payment types including virtual accounts)
  if (event.event === 'charge.success') {
    console.log('💰 Charge success event received')
    const { data } = event
    
    // Determine payment method from channel
    const channel = data.authorization?.channel || data.channel
    let paymentMethod = channel
    let userId = data.metadata?.user_id
    
    console.log('Channel:', channel)
    
    // For virtual account payments (dedicated_nuban), find user by account number
    if (channel === 'dedicated_nuban') {
      console.log('🏛️ Virtual account payment detected')
      paymentMethod = 'virtual_account'
      
      // The account number is in data.authorization.receiver_bank_account_number for DVA payments
      const accountNumber = data.authorization?.receiver_bank_account_number
      console.log('Looking for account:', accountNumber)
      
      // Find user by virtual account number
      const { data: account } = await supabase
        .from('virtual_accounts')
        .select('user_id')
        .eq('account_number', accountNumber)
        .single()
      
      if (account) {
        userId = account.user_id
        console.log('✅ Found user:', userId)
      } else {
        console.error('❌ No user found for account:', accountNumber)
      }
    }
    
    if (!userId) {
      console.error('❌ No user_id found for payment')
      return new Response('No user found', { status: 400 })
    }
    
    const amountInNaira = data.amount / 100 // Convert from kobo to naira
    console.log(`💵 Amount: ₦${amountInNaira}`)
    
    // 1. Record payment
    console.log('💾 Recording payment...')
    const { error } = await supabase.from('payments').insert({
      user_id: userId,
      reference: data.reference,
      amount: amountInNaira,
      currency: data.currency,
      status: 'success',
      payment_method: paymentMethod,
      paystack_reference: data.reference,
      authorization_code: data.authorization?.authorization_code || null,
      metadata: data.metadata,
      verified_at: new Date().toISOString(),
    })
    
    if (error) {
      console.error('❌ Failed to save payment:', error)
      return new Response('Database error', { status: 500 })
    }
    
    console.log('✅ Payment recorded successfully')
    
    // 2. Credit user's wallet
    console.log('💳 Crediting wallet...')
    const { data: walletResult, error: walletError } = await supabase
      .rpc('credit_wallet', {
        p_user_id: userId,
        p_amount: amountInNaira,
        p_description: `Deposit via ${paymentMethod}`,
        p_reference: data.reference
      })
    
    if (walletError) {
      console.error('❌ Wallet credit error:', walletError)
      // Don't fail the webhook if wallet credit fails
      // Payment is already recorded
    } else {
      const result = walletResult as { success: boolean; new_balance: number; message: string }
      if (result.success) {
        console.log(`✅ Wallet credited: ₦${amountInNaira} | New balance: ₦${result.new_balance}`)
      } else {
        console.error('❌ Wallet credit failed:', result.message)
      }
    }
  }

  return new Response('OK', { status: 200 })
})