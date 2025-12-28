// Supabase Edge Function to cancel orders with automatic refund processing
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface CancelOrderPayload {
  order_id: string;
  reason: string;
  refund_method?: 'wallet' | 'paystack';
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
    console.log('Received cancel order request');
    
    const { order_id, reason, refund_method }: CancelOrderPayload = await req.json();
    
    console.log('Cancel payload:', { order_id, reason, refund_method });

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

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:profiles!orders_user_id_fkey(id, email, full_name),
        vendor:profiles!orders_vendor_id_fkey(id, email, full_name, farm_name)
      `)
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

    // Verify user has permission
    const isCustomer = order.user_id === user.id;
    const isVendor = order.vendor_id === user.id;

    if (!isCustomer && !isVendor) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to cancel this order' }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Check cancellation eligibility based on status
    if (order.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'Order is already cancelled' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    if (order.status === 'delivered') {
      return new Response(
        JSON.stringify({ error: 'Cannot cancel delivered orders. Please contact support for returns.' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Cancellation policy enforcement
    let canCancel = false;

    if (isCustomer) {
      // Customer can cancel pending, confirmed, and processing orders
      if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') {
        canCancel = true;
      }
    } else if (isVendor) {
      // Vendor can cancel pending, confirmed, and processing orders
      if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') {
        canCancel = true;
      }
    }

    if (!canCancel) {
      return new Response(
        JSON.stringify({ 
          error: `Cannot cancel order in ${order.status} status. Only pending, confirmed, and processing orders can be cancelled.`,
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Update order to cancelled
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to cancel order');
    }

    console.log('Order cancelled successfully');

    // Process refund if payment was made
    let refundResult = null;
    
    if (order.payment_status === 'paid' && order.payment_amount > 0) {
      console.log('Processing refund for cancelled order');

      try {
        // Call process-refund function
        const refundMethod = refund_method || 'wallet'; // Default to wallet for speed

        const refundResponse = await fetch(`${supabaseUrl}/functions/v1/process-refund`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authHeader.replace('Bearer ', '')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: order.id,
            refund_method: refundMethod,
            reason: `Order cancelled: ${reason}`,
          }),
        });

        const refundData = await refundResponse.json();
        
        if (!refundResponse.ok) {
          console.error('Refund failed:', refundData);
          // Don't fail the cancellation, just log the refund failure
          refundResult = { 
            success: false, 
            error: refundData.error,
            message: 'Order cancelled but refund failed. Please contact support.',
          };
        } else {
          console.log('Refund processed successfully:', refundData);
          refundResult = {
            success: true,
            refund_id: refundData.refund_id,
            refund_amount: refundData.refund_amount,
            refund_method: refundData.refund_method,
          };
        }
      } catch (refundError: any) {
        console.error('Error calling refund function:', refundError);
        refundResult = { 
          success: false, 
          error: refundError.message,
          message: 'Order cancelled but refund failed. Please contact support.',
        };
      }
    }

    // Send notifications
    // Notify customer
    await supabase.from('notifications').insert({
      user_id: order.user_id,
      title: isCustomer ? 'Order Cancelled' : 'Vendor Cancelled Your Order',
      message: isCustomer 
        ? `Your order has been cancelled. ${refundResult?.success ? `Refund of ₦${order.payment_amount} processed.` : ''}`
        : `${order.vendor.farm_name || 'The vendor'} cancelled your order. ${refundResult?.success ? `Refund of ₦${order.payment_amount} processed.` : ''}`,
      type: 'order',
      is_read: false,
    });

    // Notify vendor if customer cancelled
    if (isCustomer) {
      await supabase.from('notifications').insert({
        user_id: order.vendor_id,
        title: 'Order Cancelled by Customer',
        message: `${order.customer.full_name} cancelled order #${order.id.slice(0, 8)} - ₦${order.total}`,
        type: 'order',
        is_read: false,
      });
    }

    // Notify customer if vendor cancelled
    if (isVendor && order.user_id !== order.vendor_id) {
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: 'Order Cancelled',
        message: `${order.vendor.farm_name || 'The vendor'} cancelled your order. ${refundResult?.success ? 'Your refund has been processed.' : 'Please contact support for refund.'}`,
        type: 'order',
        is_read: false,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order cancelled successfully',
        order_id: order.id,
        cancelled_by: isCustomer ? 'customer' : 'vendor',
        refund_processed: refundResult?.success || false,
        refund_result: refundResult,
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
    console.error('Error cancelling order:', error);
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
