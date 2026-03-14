import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface SendNotificationRequest {
  title: string;
  message: string;
  user_ids?: string[];
  role?: 'customer' | 'vendor';
  type?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { title, message, user_ids, role, type } =
      (await req.json()) as SendNotificationRequest;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'title and message are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Build query for push tokens
    let query = supabase
      .from('profiles')
      .select('expo_push_token')
      .eq('push_notifications_enabled', true)
      .not('expo_push_token', 'is', null);

    if (user_ids && user_ids.length > 0) {
      query = query.in('id', user_ids);
    } else if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching push tokens:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch recipients' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const tokens = (users || [])
      .map((u: any) => u.expo_push_token)
      .filter((t: string) => t && t.startsWith('ExponentPushToken'));

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No valid push tokens found' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Send in batches of 100 (Expo Push API limit)
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < tokens.length; i += 100) {
      const batch = tokens.slice(i, i + 100);

      const messages = batch.map((token: string) => ({
        to: token,
        sound: 'default',
        title,
        body: message,
        data: { type: type || 'system' },
      }));

      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(messages),
        });

        if (res.ok) {
          const result = await res.json();
          const tickets = result.data || [];
          totalSent += tickets.filter((t: any) => t.status === 'ok').length;
          totalFailed += tickets.filter((t: any) => t.status === 'error').length;
        } else {
          console.error('Expo Push API error:', res.status, await res.text());
          totalFailed += batch.length;
        }
      } catch (batchError) {
        console.error('Batch send error:', batchError);
        totalFailed += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        failed: totalFailed,
        total_tokens: tokens.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err: any) {
    console.error('Send notification error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
