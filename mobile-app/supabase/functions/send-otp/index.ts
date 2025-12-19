// supabase/functions/send-otp/index.ts
// Secure OTP Sender - Nigerian Fintech Grade
// Works with Resend, Brevo, or any email provider

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOtpRequest {
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS
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
    const { email } = await req.json();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service_role key (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limit: 3 OTPs per email in 10 mins
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('email_otps')
      .select('id')
      .eq('email', email.toLowerCase())
      .gte('created_at', tenMinsAgo);

    if (recent && recent.length >= 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many attempts. Wait 10 mins.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate & hash OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store in DB
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: dbError } = await supabase
      .from('email_otps')
      .insert({
        email: email.toLowerCase(),
        code_hash: codeHash,
        expires_at: expiresAt,
      });

    if (dbError) throw dbError;

    // Send email
    // Bypass for test email
    if (email === 'test@chopnow.com') {
      console.log('🧪 Test Mode: generated OTP', code);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP sent (Test Mode)',
          // In test mode, we can optionally return the code or just rely on console logs if local
          // But since this is likely remote, returning it is helpful for the user
          dev_token: code
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResult = await sendEmail(email, code);
    if (!emailResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: emailResult.error || 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP sent successfully!',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('OTP Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface EmailResult {
  success: boolean;
  error?: string;
}

async function sendEmail(to: string, code: string): Promise<EmailResult> {
  const resendKey = Deno.env.get('RESEND_API_KEY');

  // Require Resend API key - no dev mode bypass
  if (!resendKey) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Server configuration error: Missing RESEND_API_KEY' };
  }

  try {
    console.log(`Sending email to ${to} via Resend...`);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Chow <onboarding@resend.dev>',  // Using Resend's test domain
        to,
        subject: 'Your Chow Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Verify Your Email</h1>
            <p style="font-size: 16px; color: #666;">Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; border-radius: 8px;">
              ${code}
            </div>
            <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
            <p style="font-size: 12px; color: #999; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Resend API error:', res.status, errorText);
      // Try to parse JSON error from Resend
      try {
        const errJson = JSON.parse(errorText);
        return { success: false, error: `Email Provider Error: ${errJson.message || errorText}` };
      } catch {
        return { success: false, error: `Email Provider Error: ${errorText}` };
      }
    }

    const result = await res.json();
    console.log('Email sent successfully via Resend:', result);
    return { success: true };
  } catch (e: any) {
    console.error('Resend failed:', e);
    return { success: false, error: `Network/System Error: ${e.message}` };
  }
}