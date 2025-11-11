import { supabase } from "@/lib/supabase"

// Types for structured responses
export interface AuthResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// User-friendly error messages
const getErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred'
  
  const message = error.message?.toLowerCase() || ''
  
  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password'
  }
  if (message.includes('user already registered')) {
    return 'An account with this email already exists'
  }
  if (message.includes('email not confirmed')) {
    return 'Please verify your email before logging in'
  }
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address'
  }
  if (message.includes('password')) {
    return 'Password must be at least 6 characters'
  }
  if (message.includes('network')) {
    return 'Network error. Please check your connection'
  }
  if (message.includes('token') && message.includes('expired')) {
    return 'Verification code expired. Please request a new one'
  }
  if (message.includes('token') || message.includes('otp')) {
    return 'Invalid verification code. Please check and try again'
  }
  
  return error.message || 'Something went wrong. Please try again'
}

export async function signUp(
  email: string, 
  password: string, 
  name?: string,
  role: 'customer' | 'vendor' = 'customer'
): Promise<AuthResult> {
  try {
    console.log('📝 Starting signup process...', { email, name, role })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: role == 'vendor' ? 'vendor' : 'customer' },
        emailRedirectTo: undefined // Prevent auto-redirect
      }
    })
    
    console.log('📧 Signup response:', { 
      hasUser: !!data?.user, 
      hasSession: !!data?.session,
      userId: data?.user?.id,
      error: error?.message 
    })
    
    if (error) {
      console.error('❌ Signup error:', error)
      return {
        success: false,
        error: getErrorMessage(error)
      }
    }
    
    if (!data?.user) {
      console.error('❌ No user returned from signup')
      return {
        success: false,
        error: 'Failed to create account. Please try again.'
      }
    }
    
    console.log('✅ Signup successful, user created:', data.user.id)
    
    // Return the full data object (includes user even if session is null)
    return {
      success: true,
      data: data
    }
  } catch (error) {
    console.error('💥 Signup exception:', error)
    return {
      success: false,
      error: getErrorMessage(error)
    }
  }
}

export async function signIn(
  email: string, 
  password: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    
    if (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      }
    }
    
    return {
      success: true,
      data: data.session
    }
  } catch (error) {
    console.error('Sign in exception:', error)
    return {
      success: false,
      error: getErrorMessage(error)
    }
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Sign out exception:', error)
    return {
      success: false,
      error: getErrorMessage(error)
    }
  }
}

export async function verifyOtp(
  email: string,
  token: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    })
    
    if (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      }
    }
    
    return {
      success: true,
      data: data.session
    }
  } catch (error) {
    console.error('Verify OTP exception:', error)
    return {
      success: false,
      error: getErrorMessage(error)
    }
  }
}

export async function resendOtp(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    })
    
    if (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      }
    }
    
    return { 
      success: true,
      data: { message: 'Verification code sent to your email' }
    }
  } catch (error) {
    console.error('Resend OTP exception:', error)
    return {
      success: false,
      error: getErrorMessage(error)
    }
  }
}

// ✅ NEW: Email OTP flow (custom Edge Functions)
const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`

export async function requestEmailOtp(email: string): Promise<AuthResult> {
  try {
    console.log('📧 Requesting OTP for:', email)
    console.log('🔗 URL:', `${FUNCTIONS_URL}/send-otp`)
    
    const response = await fetch(`${FUNCTIONS_URL}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email }),
    })

    console.log('📡 Response status:', response.status)
    const result = await response.json()
    console.log('📦 Response data:', result)

    if (!response.ok || !result.success) {
      console.error('❌ OTP request failed:', result.error)
      return {
        success: false,
        error: result.error || 'Failed to send verification code'
      }
    }

    console.log('✅ OTP sent successfully')
    return {
      success: true,
      data: { message: result.message }
    }
  } catch (error) {
    console.error('💥 Request OTP exception:', error)
    return {
      success: false,
      error: 'Network error. Please check your connection.'
    }
  }
}

export async function verifyEmailOtp(
  email: string,
  code: string,
  name: string,
  password: string,
  role: 'customer' | 'vendor' = 'customer'
): Promise<AuthResult> {
  try {
    console.log('🔍 Verifying OTP for:', email)
    console.log('🔗 URL:', `${FUNCTIONS_URL}/verify-otp`)
    
    const response = await fetch(`${FUNCTIONS_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email, code, name, password, role }),
    })

    console.log('📡 Response status:', response.status)
    const result = await response.json()
    console.log('📦 Response data:', result)

    if (!response.ok || !result.success) {
      console.error('❌ OTP verification failed:', result.error)
      return {
        success: false,
        error: result.error || 'Invalid verification code'
      }
    }

    console.log('✅ OTP verified, user created:', result.user?.id)
    return {
      success: true,
      data: result.user
    }
  } catch (error) {
    console.error('💥 Verify OTP exception:', error)
    return {
      success: false,
      error: 'Network error. Please check your connection.'
    }
  }
}

export async function resendEmailOtp(email: string): Promise<AuthResult> {
  // Reuse the same send-otp function
  return requestEmailOtp(email)
}

export async function updateProfile(
  userId: string,
  updates: {
    name?: string
    email?: string
    // role should only be updated by admin
  }
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      }
    }
    
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Update profile exception:', error)
    return {
      success: false,
      error: getErrorMessage(error)
    }
  }
}