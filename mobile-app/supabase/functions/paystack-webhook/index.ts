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
    
    // 1. Record payment (use upsert to handle duplicate references gracefully,
    // since paystack-verify may have already recorded this payment)
    console.log('💾 Recording payment...')
    const { error } = await supabase.from('payments').upsert({
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
    }, { onConflict: 'reference' })
    
    if (error) {
      console.error('❌ Failed to save payment:', error)
      return new Response('Database error', { status: 500 })
    }
    
    console.log('✅ Payment recorded successfully')
    
    // 2. Credit user's wallet ONLY for deposit/top-up payments, NOT order payments.
    // Order payments go through escrow and are released to vendors after delivery + 24hr hold.
    const orderType = data.metadata?.order_type
    if (orderType !== 'product_purchase') {
      console.log('💳 Crediting wallet (deposit payment)...')
      const { data: walletResult, error: walletError } = await supabase
        .rpc('credit_wallet', {
          p_user_id: userId,
          p_amount: amountInNaira,
          p_description: `Deposit via ${paymentMethod}`,
          p_reference: data.reference
        })

      if (walletError) {
        console.error('❌ Wallet credit error:', walletError)
      } else {
        const result = walletResult as { success: boolean; new_balance: number; message: string }
        if (result.success) {
          console.log(`✅ Wallet credited: ₦${amountInNaira} | New balance: ₦${result.new_balance}`)
        } else {
          console.error('❌ Wallet credit failed:', result.message)
        }
      }
    } else {
      console.log('📦 Order payment - skipping wallet credit (handled by escrow)')
    }
  }

  // Handle transfer.success event (withdrawal completed)
  if (event.event === 'transfer.success') {
    console.log('✅ Transfer success event received')
    const { data } = event
    const reference = data.reference
    const transferCode = data.transfer_code

    // Look up payout by paystack_transfer_code (most reliable)
    const { error: updateError } = await supabase
      .from('vendor_payouts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        paystack_response: data,
      })
      .eq('paystack_transfer_code', transferCode)

    if (updateError) {
      console.error('❌ Failed to update payout record:', updateError)
    } else {
      console.log(`✅ Payout marked as completed: ${transferCode}`)
    }
  }

  // Handle transfer.failed and transfer.reversed events (withdrawal failed)
  if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
    console.log(`❌ Transfer ${event.event} event received`)
    const { data } = event
    const reference = data.reference
    const transferCode = data.transfer_code

    // Find the payout record by paystack_transfer_code
    const { data: payout } = await supabase
      .from('vendor_payouts')
      .select('id, vendor_id, amount')
      .eq('paystack_transfer_code', transferCode)
      .single()

    if (payout) {
      // Reverse the wallet debit - credit the money back
      console.log(`💳 Reversing wallet debit for vendor ${payout.vendor_id}...`)
      const { data: creditResult, error: creditError } = await supabase
        .rpc('credit_wallet', {
          p_user_id: payout.vendor_id,
          p_amount: payout.amount,
          p_description: `Reversal: Failed withdrawal ${reference}`,
          p_reference: `reversal_${reference}`,
        })

      if (creditError) {
        console.error('❌ Failed to reverse wallet debit:', creditError)
      } else {
        const result = creditResult as { success: boolean; new_balance: number }
        if (result.success) {
          console.log(`✅ Wallet credited back: ₦${payout.amount} | New balance: ₦${result.new_balance}`)
        }
      }

      // Update payout record
      await supabase
        .from('vendor_payouts')
        .update({
          status: 'failed',
          failure_reason: data.reason || `Transfer ${event.event}`,
          paystack_response: data,
        })
        .eq('id', payout.id)

      // Notify vendor
      await supabase.from('notifications').insert({
        user_id: payout.vendor_id,
        title: 'Withdrawal Failed',
        message: `Your withdrawal of ₦${payout.amount.toLocaleString()} could not be completed. The funds have been returned to your wallet.`,
        type: 'payment',
        is_read: false,
      })
    } else {
      console.error('❌ No payout record found for reference:', reference)
    }
  }

  return new Response('OK', { status: 200 })
})