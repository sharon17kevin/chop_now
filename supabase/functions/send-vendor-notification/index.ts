// Supabase Edge Function to send push notifications to vendors
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface NotificationPayload {
  vendor_id: string;
  order_id: string;
  customer_name: string;
  total_amount: number;
  item_count: number;
  order_items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
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
    console.log('Received notification request');
    
    const { vendor_id, order_id, customer_name, total_amount, item_count, order_items }: NotificationPayload = await req.json();
    
    console.log('Payload:', { vendor_id, order_id, customer_name, total_amount, item_count });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get vendor's push token and preferences
    const { data: vendor, error: vendorError } = await supabase
      .from('profiles')
      .select('expo_push_token, push_notifications_enabled, full_name, farm_name')
      .eq('id', vendor_id)
      .single();

    if (vendorError || !vendor) {
      console.error('Vendor not found:', vendorError);
      return new Response(
        JSON.stringify({ error: 'Vendor not found' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Always create in-app notification first (works even without push notifications)
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: vendor_id,
      title: 'New Order Received',
      message: `${customer_name} placed an order for ₦${total_amount.toFixed(2)}`,
      type: 'order',
      is_read: false,
    });

    if (notifError) {
      console.error('Error creating in-app notification:', notifError);
    } else {
      console.log('In-app notification created successfully');
    }

    // Check if vendor has notifications enabled
    if (!vendor.push_notifications_enabled) {
      console.log('Vendor has push notifications disabled - in-app notification created');
      return new Response(
        JSON.stringify({ 
          message: 'In-app notification created. Push notifications disabled by vendor.',
          in_app_created: true,
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Check if vendor has a push token
    if (!vendor.expo_push_token) {
      console.warn('Vendor has no push token - in-app notification created');
      return new Response(
        JSON.stringify({ 
          message: 'In-app notification created. No push token registered.',
          in_app_created: true,
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Format item list for notification body
    const itemsList = order_items
      .slice(0, 3)
      .map(item => `${item.quantity}x ${item.product_name}`)
      .join(', ');
    const moreItems = order_items.length > 3 ? ` +${order_items.length - 3} more` : '';

    // Prepare push notification
    const message = {
      to: vendor.expo_push_token,
      sound: 'default',
      title: '🛒 New Order Received!',
      body: `${customer_name} ordered ${item_count} item(s) - ₦${total_amount.toFixed(2)}\n${itemsList}${moreItems}`,
      data: {
        type: 'new_order',
        order_id,
        customer_name,
        total_amount,
        item_count,
        screen: '/(tabs)/(sell)/orders',
      },
      priority: 'high',
      channelId: 'orders',
    };

    // Try to send push notification via Expo
    try {
      const pushResponse = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const pushResult = await pushResponse.json();

      if (!pushResponse.ok || pushResult.data?.status === 'error') {
        console.error('Expo push error:', pushResult);
        // Don't throw - in-app notification already created
        return new Response(
          JSON.stringify({ 
            success: false,
            message: 'In-app notification created. Push notification failed.',
            in_app_created: true,
            push_error: pushResult,
          }),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            } 
          }
        );
      }

      console.log('Push notification sent successfully');
    } catch (pushError: any) {
      console.error('Error sending push notification:', pushError);
      // Continue - in-app notification already created
    }

    // Update order notification status
    await supabase
      .from('orders')
      .update({
        vendor_notified: true,
        vendor_notified_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'In-app and push notifications sent successfully',
        in_app_created: true,
        push_sent: true,
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
    console.error('Error sending notification:', error);
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