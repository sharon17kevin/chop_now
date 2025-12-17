import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    })
  }

  try {
    console.log('🚀 DVA Creation Started')
    
    // Validate environment variables
    if (!PAYSTACK_SECRET_KEY) {
      console.error('❌ PAYSTACK_SECRET_KEY not configured')
      throw new Error('Paystack secret key not configured')
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials missing')
      throw new Error('Supabase credentials not configured')
    }

    const { userId, email } = await req.json()
    console.log('📧 Request:', { userId, email })

    if (!userId || !email) {
      throw new Error('userId and email are required')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if user already has a virtual account
    const { data: existing } = await supabase
      .from('virtual_accounts')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) {
      console.log('✅ User already has virtual account')
      return new Response(
        JSON.stringify({ 
          success: true,
          data: {
            account_number: existing.account_number,
            account_name: existing.account_name,
            bank_name: existing.bank_name,
            bank_code: existing.bank_code,
          }
        }), 
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Create customer
    console.log('👤 Creating Paystack customer...')
    const customerRes = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!customerRes.ok) {
      const errorData = await customerRes.json()
      console.error('❌ Customer creation failed:', errorData)
      throw new Error(errorData.message || 'Failed to create customer')
    }

    const customerData = await customerRes.json()
    if (!customerData.status || !customerData.data?.customer_code) {
      throw new Error(customerData.message || 'Invalid customer response')
    }

    const customerCode = customerData.data.customer_code
    console.log('✅ Customer created:', customerCode)

    // Create DVA - use test-bank for test mode
    const preferredBank = PAYSTACK_SECRET_KEY.startsWith('sk_test_') ? 'test-bank' : 'wema-bank'
    console.log('💳 Creating DVA with bank:', preferredBank)

    const dvaRes = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: customerCode,
        preferred_bank: preferredBank,
      }),
    })

    const dvaData = await dvaRes.json()
    
    // Check for feature unavailable error
    if (!dvaData.status) {
      console.error('❌ DVA creation failed:', dvaData)
      
      if (dvaData.code === 'feature_unavailable') {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Dedicated Virtual Accounts not enabled for your account',
            message: 'Email support@paystack.com to request DVA access for your business.',
            code: 'feature_unavailable',
            alternatives: {
              immediate: [
                'Card Payment - Users can pay with cards',
                'One-time Bank Transfer - Generate payment links'
              ],
              documentation: 'https://paystack.com/docs/payments/dedicated-virtual-accounts'
            }
          }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            } 
          }
        )
      }
      
      throw new Error(dvaData.message || 'Failed to create dedicated account')
    }

    if (!dvaData.data) {
      throw new Error(dvaData.message || 'Invalid DVA response')
    }

    console.log('💾 Saving to database...')
    const { error: dbError } = await supabase
      .from('virtual_accounts')
      .insert({
        user_id: userId,
        account_number: dvaData.data.account_number,
        account_name: dvaData.data.account_name,
        bank_name: dvaData.data.bank.name,
        bank_code: dvaData.data.bank.id?.toString() || null,
        paystack_customer_code: customerCode,
        paystack_account_id: dvaData.data.id?.toString() || null,
        is_active: true,
      })

    if (dbError) {
      console.error('❌ Database error:', dbError)
      throw new Error(`Database error: ${dbError.message}`)
    }

    console.log('✅ DVA created successfully!')
    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          account_number: dvaData.data.account_number,
          account_name: dvaData.data.account_name,
          bank_name: dvaData.data.bank.name,
          bank_code: dvaData.data.bank.id,
        }
      }), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('💥 Error:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }), 
      {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})