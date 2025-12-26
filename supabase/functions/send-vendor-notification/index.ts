// Supabase Edge Function to send push notifications to vendors
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  try {
    const { vendor_id, order_id, customer_name, total_amount, item_count, order_items }: NotificationPayload = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get vendor's push token and preferences
    const { data: vendor, error: vendorError } = await supabase
      .from('profiles')
      .select('expo_push_token, notification_preferences, full_name, farm_name')
      .eq('id', vendor_id)
      .single();

    if (vendorError || !vendor) {
      console.error('Vendor not found:', vendorError);
      return new Response(
        JSON.stringify({ error: 'Vendor not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if vendor has notifications enabled
    const preferences = vendor.notification_preferences || {};
    if (!preferences.new_orders) {
      return new Response(
        JSON.stringify({ message: 'Vendor has new order notifications disabled' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if vendor has a push token
    if (!vendor.expo_push_token) {
      console.warn('Vendor has no push token:', vendor_id);
      return new Response(
        JSON.stringify({ message: 'Vendor has no push token registered' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
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

    // Send push notification via Expo
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
      throw new Error('Failed to send push notification');
    }

    // Create in-app notification record
    await supabase.from('notifications').insert({
      user_id: vendor_id,
      title: 'New Order Received',
      message: `${customer_name} placed an order for ₦${total_amount.toFixed(2)}`,
      type: 'order',
      is_read: false,
    });

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
        message: 'Notification sent successfully',
        push_result: pushResult,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});