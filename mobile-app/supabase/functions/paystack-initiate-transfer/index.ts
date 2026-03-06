import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, amount, bank_code, account_number, account_name } = await req.json()

    if (!user_id || !amount || !bank_code || !account_number || !account_name) {
      throw new Error('Missing required fields: user_id, amount, bank_code, account_number, account_name')
    }

    if (amount < 5000) {
      throw new Error('Minimum withdrawal amount is ₦5,000')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Get user profile and check for existing recipient code
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('paystack_recipient_code, bank_account_number, bank_code, bank_name, account_name')
      .eq('id', user_id)
      .single()

    if (profileError) throw new Error('User profile not found')

    // 2. Check wallet balance
    const { data: walletBalance } = await supabase.rpc('get_wallet_balance', { p_user_id: user_id })

    if (!walletBalance || walletBalance < amount) {
      throw new Error(`Insufficient balance. Available: ₦${walletBalance || 0}`)
    }

    // 3. Create or reuse Paystack transfer recipient
    let recipientCode = profile.paystack_recipient_code

    // Create new recipient if none exists or bank details changed
    if (!recipientCode || profile.bank_account_number !== account_number || profile.bank_code !== bank_code) {
      console.log('Creating Paystack transfer recipient...')

      const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nuban',
          name: account_name,
          account_number: account_number,
          bank_code: bank_code,
          currency: 'NGN',
        }),
      })

      const recipientData = await recipientRes.json()

      if (!recipientData.status) {
        throw new Error(recipientData.message || 'Failed to create transfer recipient')
      }

      recipientCode = recipientData.data.recipient_code

      // Save recipient code and bank details to profile
      await supabase
        .from('profiles')
        .update({
          paystack_recipient_code: recipientCode,
          bank_account_number: account_number,
          bank_code: bank_code,
          bank_name: recipientData.data.details.bank_name,
          account_name: account_name,
          bank_account_verified: true,
          bank_account_verified_at: new Date().toISOString(),
        })
        .eq('id', user_id)
    }

    // 4. Generate unique withdrawal reference
    const withdrawalRef = `withdrawal_${Date.now()}_${user_id.slice(0, 8)}`

    // 5. Debit wallet first (atomic with balance check)
    const { data: debitResult, error: debitError } = await supabase.rpc('debit_wallet', {
      p_user_id: user_id,
      p_amount: amount,
      p_description: `Withdrawal to ${account_name} (${account_number})`,
      p_reference: withdrawalRef,
    })

    if (debitError) throw new Error('Failed to debit wallet')

    const debit = debitResult as { success: boolean; message: string }
    if (!debit.success) {
      throw new Error(debit.message || 'Insufficient balance')
    }

    // 6. Initiate Paystack transfer
    console.log('Initiating Paystack transfer...')
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(amount * 100), // Convert to kobo
        recipient: recipientCode,
        reference: withdrawalRef,
        reason: `Chow vendor withdrawal - ${withdrawalRef}`,
      }),
    })

    const transferData = await transferRes.json()

    if (!transferData.status) {
      // Transfer failed - reverse wallet debit
      console.error('Transfer failed, reversing wallet debit:', transferData)
      await supabase.rpc('credit_wallet', {
        p_user_id: user_id,
        p_amount: amount,
        p_description: `Reversal: Failed withdrawal ${withdrawalRef}`,
        p_reference: `reversal_${withdrawalRef}`,
      })
      throw new Error(transferData.message || 'Transfer failed')
    }

    // 7. Create vendor_payouts record
    const { data: payout, error: payoutError } = await supabase
      .from('vendor_payouts')
      .insert({
        vendor_id: user_id,
        amount: amount,
        currency: 'NGN',
        status: 'processing',
        payment_method: 'bank_transfer',
        order_ids: [],
        order_count: 0,
        bank_account_number: account_number,
        bank_name: transferData.data?.details?.bank_name || profile.bank_name,
        account_name: account_name,
        paystack_transfer_id: transferData.data?.id?.toString(),
        paystack_transfer_code: transferData.data?.transfer_code,
        paystack_response: transferData.data,
        initiated_at: new Date().toISOString(),
        notes: `Withdrawal ref: ${withdrawalRef}`,
        metadata: { reference: withdrawalRef },
      })
      .select()
      .single()

    if (payoutError) {
      console.error('Failed to create payout record:', payoutError)
      // Don't fail - transfer is already initiated
    }

    return new Response(
      JSON.stringify({
        success: true,
        payout_id: payout?.id,
        transfer_code: transferData.data?.transfer_code,
        reference: withdrawalRef,
        amount: amount,
        message: 'Withdrawal initiated successfully. Funds will arrive within 24 hours.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Withdrawal error:', error.message)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
