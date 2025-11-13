// supabase/functions/verify-otp/index.ts
// Verify OTP + Create User – Fintech Grade (Jumia/Paystack level)
// November 10, 2025 – Built for @Sharonkvn
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const { email, code, name, password, role = 'customer' } = await req.json();
    // === INPUT VALIDATION ===
    if (!email || !code || !name || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'All fields are required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email format'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Code must be 6 digits'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Password must be 8+ characters'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    // === SUPABASE SERVICE CLIENT ===
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    // === HASH THE CODE ===
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const codeHash = Array.from(new Uint8Array(hashBuffer)).map((b)=>b.toString(16).padStart(2, '0')).join('');
    // === FETCH LATEST OTP ===
    const { data: otp, error: otpError } = await supabase.from('email_otps').select('*').eq('email', normalizedEmail).gte('expires_at', new Date().toISOString()).order('created_at', {
      ascending: false
    }).limit(1).single();
    if (otpError || !otp) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid or expired code'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // === CHECK ATTEMPTS ===
    if (otp.attempts >= 5) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many attempts. Request a new code.'
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // === VERIFY HASH ===
    if (otp.code_hash !== codeHash) {
      await supabase.from('email_otps').update({
        attempts: otp.attempts + 1
      }).eq('id', otp.id);
      const remaining = 4 - otp.attempts;
      return new Response(JSON.stringify({
        success: false,
        error: `Wrong code. ${remaining} attempt${remaining !== 1 ? 's' : ''} left.`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // === SUCCESS: CREATE USER ===
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || '',  // ✅ Ensure name is always a string
        role
      }
    });
    if (authError) {
      console.error('Auth creation error:', authError.message);
      
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        // Clean up OTPs
        await supabase.from('email_otps').delete().eq('email', normalizedEmail);
        
        return new Response(JSON.stringify({
          success: false,
          error: 'This email is already registered. Please log in instead.'
        }), {
          status: 409,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Return generic error for other auth errors
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create account. Please try again.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!authData.user) {
      console.error('❌ No user data returned from createUser');
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create account. Please try again.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`✅ User created: ${authData.user.id} | ${normalizedEmail} | Role: ${role}`);

    // === CREATE PROFILE IN PROFILES TABLE ===
    console.log('📝 Creating profile in profiles table...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: normalizedEmail,
        name: name || '',  // ✅ Ensure name is always a string, not null
        role: role
      });

    if (profileError) {
      console.error('⚠️ Profile creation error:', profileError.message);
      // Don't fail the whole operation - trigger might handle it
    } else {
      console.log('✅ Profile created successfully');
    }

    // === DELETE ALL OTPS FOR THIS EMAIL ===
    await supabase.from('email_otps').delete().eq('email', normalizedEmail);
    console.log('🧹 OTPs cleaned up');

    // === SIGN IN USER SERVER-SIDE TO GET SESSION ===
    console.log('🔐 Signing in user server-side...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (signInError || !signInData.session) {
      console.error('⚠️ Sign in error:', signInError?.message);
      // User was created successfully, but sign-in failed
      // Client can sign in manually
      return new Response(JSON.stringify({
        success: true,
        message: 'Account created successfully!',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role
        },
        session: null
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('✅ User signed in successfully');

    // === RETURN SUCCESS WITH SESSION ===
    return new Response(JSON.stringify({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role
      },
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        expires_at: signInData.session.expires_at,
        expires_in: signInData.session.expires_in,
        user: signInData.session.user
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Server error. Please try again.'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
