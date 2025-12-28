// Supabase Edge Function to process refunds for cancelled orders
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;
const PAYSTACK_REFUND_URL = 'https://api.paystack.co/refund';

interface RefundPayload {
  order_id: string;
  refund_method: 'wallet' | 'paystack' | 'manual';
  reason?: string;
  partial_amount?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('Received refund request');
    
    const { order_id, refund_method, reason, partial_amount }: RefundPayload = await req.json();
    
    console.log('Refund payload:', { order_id, refund_method, reason, partial_amount });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Get order details with payment info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, profiles!orders_user_id_fkey(email, full_name)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Verify user has permission (customer or vendor)
    if (order.user_id !== user.id && order.vendor_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to refund this order' }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Validate order is eligible for refund
    if (order.status === 'delivered') {
      return new Response(
        JSON.stringify({ error: 'Cannot refund delivered orders. Please contact support.' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    if (order.refund_status === 'completed') {
      return new Response(
        JSON.stringify({ error: 'Order already refunded' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    if (order.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Order payment not confirmed. Cannot process refund.' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Calculate refund amount
    const refundAmount = partial_amount || order.payment_amount || order.total;

    if (refundAmount > (order.payment_amount || order.total)) {
      return new Response(
        JSON.stringify({ error: 'Refund amount exceeds order total' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Create refund record
    const { data: refundRecord, error: refundInsertError } = await supabase
      .from('refunds')
      .insert({
        order_id: order.id,
        payment_reference: order.payment_reference,
        amount: refundAmount,
        status: 'pending',
        refund_method,
        initiated_by: user.id,
        notes: reason,
      })
      .select()
      .single();

    if (refundInsertError) {
      console.error('Error creating refund record:', refundInsertError);
      throw new Error('Failed to create refund record');
    }

    let refundResult: any = null;

    // Process refund based on method
    if (refund_method === 'wallet') {
      // Instant wallet credit
      console.log('Processing wallet refund:', { user_id: order.user_id, amount: refundAmount });

      const { data: walletResult, error: walletError } = await supabase
        .rpc('credit_wallet', {
          p_user_id: order.user_id,
          p_amount: refundAmount,
          p_description: `Refund for cancelled order #${order.id.slice(0, 8)}`,
          p_reference: `refund_${refundRecord.id}`,
        });

      if (walletError) {
        console.error('Wallet credit error:', walletError);
        
        // Update refund status to failed
        await supabase
          .from('refunds')
          .update({
            status: 'failed',
            failure_reason: walletError.message,
          })
          .eq('id', refundRecord.id);

        throw new Error('Failed to credit wallet: ' + walletError.message);
      }

      console.log('Wallet credited successfully:', walletResult);
      refundResult = { method: 'wallet', wallet_balance: walletResult };

      // Update refund to completed
      await supabase
        .from('refunds')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', refundRecord.id);

      // Update order refund status
      await supabase
        .from('orders')
        .update({
          refund_status: 'completed',
          refund_amount: refundAmount,
          refund_method: 'wallet',
          refunded_at: new Date().toISOString(),
          payment_status: partial_amount ? 'partially_refunded' : 'refunded',
        })
        .eq('id', order.id);

    } else if (refund_method === 'paystack') {
      // Process Paystack refund
      console.log('Processing Paystack refund');

      if (!order.payment_reference) {
        throw new Error('No payment reference found for this order');
      }

      // Update refund to processing
      await supabase
        .from('refunds')
        .update({ status: 'processing' })
        .eq('id', refundRecord.id);

      // Call Paystack refund API
      const paystackResponse = await fetch(PAYSTACK_REFUND_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: order.payment_reference,
          amount: Math.round(refundAmount * 100), // Convert to kobo
        }),
      });

      const paystackData = await paystackResponse.json();
      console.log('Paystack refund response:', paystackData);

      if (!paystackResponse.ok || !paystackData.status) {
        console.error('Paystack refund failed:', paystackData);
        
        // Update refund to failed
        await supabase
          .from('refunds')
          .update({
            status: 'failed',
            failure_reason: paystackData.message || 'Paystack refund failed',
            paystack_response: paystackData,
          })
          .eq('id', refundRecord.id);

        // Fallback to wallet refund
        console.log('Falling back to wallet refund');
        
        const { data: walletFallback, error: walletFallbackError } = await supabase
          .rpc('credit_wallet', {
            p_user_id: order.user_id,
            p_amount: refundAmount,
            p_description: `Refund for order #${order.id.slice(0, 8)} (Paystack failed, credited to wallet)`,
            p_reference: `refund_${refundRecord.id}_wallet_fallback`,
          });

        if (walletFallbackError) {
          throw new Error('Paystack refund failed and wallet fallback failed');
        }

        // Update to completed with wallet method
        await supabase
          .from('refunds')
          .update({
            status: 'completed',
            refund_method: 'wallet',
            completed_at: new Date().toISOString(),
            notes: (reason || '') + ' | Paystack failed, refunded to wallet',
          })
          .eq('id', refundRecord.id);

        await supabase
          .from('orders')
          .update({
            refund_status: 'completed',
            refund_amount: refundAmount,
            refund_method: 'wallet',
            refunded_at: new Date().toISOString(),
            payment_status: partial_amount ? 'partially_refunded' : 'refunded',
          })
          .eq('id', order.id);

        refundResult = { 
          method: 'wallet', 
          note: 'Refunded to wallet (Paystack unavailable)',
          wallet_balance: walletFallback,
        };

      } else {
        // Paystack refund successful
        refundResult = { 
          method: 'paystack', 
          paystack_refund_id: paystackData.data?.id,
          message: paystackData.message,
        };

        // Update refund to completed
        await supabase
          .from('refunds')
          .update({
            status: 'completed',
            paystack_refund_id: paystackData.data?.id,
            paystack_response: paystackData,
            completed_at: new Date().toISOString(),
          })
          .eq('id', refundRecord.id);

        // Update order
        await supabase
          .from('orders')
          .update({
            refund_status: 'completed',
            refund_amount: refundAmount,
            refund_reference: paystackData.data?.id,
            refund_method: 'paystack',
            refunded_at: new Date().toISOString(),
            payment_status: partial_amount ? 'partially_refunded' : 'refunded',
          })
          .eq('id', order.id);
      }

    } else {
      // Manual refund - requires admin action
      await supabase
        .from('refunds')
        .update({ status: 'pending' })
        .eq('id', refundRecord.id);

      await supabase
        .from('orders')
        .update({
          refund_status: 'pending',
          refund_amount: refundAmount,
          refund_method: 'manual',
        })
        .eq('id', order.id);

      refundResult = { method: 'manual', message: 'Refund request submitted for manual processing' };
    }

    // Create notification for customer
    await supabase.from('notifications').insert({
      user_id: order.user_id,
      title: 'Refund Processed',
      message: refund_method === 'wallet' 
        ? `₦${refundAmount.toFixed(2)} has been credited to your wallet`
        : `Your refund of ₦${refundAmount.toFixed(2)} is being processed. It may take 3-5 business days.`,
      type: 'order',
      is_read: false,
    });

    console.log('Refund processed successfully:', refundResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Refund processed successfully',
        refund_id: refundRecord.id,
        refund_amount: refundAmount,
        refund_method,
        result: refundResult,
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error: any) {
    console.error('Error processing refund:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});
