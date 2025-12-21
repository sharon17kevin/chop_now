import { supabase } from "@/lib/supabase"
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import * as AppleAuthentication from 'expo-apple-authentication'
import { Platform } from 'react-native'

// Warm up the browser for better OAuth experience
WebBrowser.maybeCompleteAuthSession()

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
      data: {
        user: result.user,
        session: result.session  // ✅ Pass session from Edge Function
      }
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

// ✅ NEW: Google OAuth Sign-In
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    console.log('🔐 Starting Google OAuth sign-in...')
    
    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'myapp',
      path: 'auth/callback'
    })
    
    console.log('📍 Redirect URL:', redirectUrl)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
      }
    })
    
    if (error) {
      console.error('❌ Google OAuth error:', error)
      return {
        success: false,
        error: getErrorMessage(error)
      }
    }
    
    if (!data.url) {
      console.error('❌ No OAuth URL returned')
      return {
        success: false,
        error: 'Failed to initialize Google sign-in'
      }
    }
    
    console.log('🌐 Opening browser for Google OAuth...')
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    )
    
    if (result.type === 'success') {
      console.log('✅ Google OAuth successful')
      const { url } = result
      
      // Extract session from URL
      const params = new URL(url).searchParams
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      
      if (access_token && refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        })
        
        if (sessionError) {
          return {
            success: false,
            error: getErrorMessage(sessionError)
          }
        }
        
        return {
          success: true,
          data: sessionData.session
        }
      }
    }
    
    console.log('❌ Google OAuth cancelled or failed:', result.type)
    return {
      success: false,
      error: 'Sign in was cancelled'
    }
  } catch (error) {
    console.error('💥 Google OAuth exception:', error)
    return {
      success: false,
      error: getErrorMessage(error)
    }
  }
}

// ✅ NEW: Apple OAuth Sign-In
export async function signInWithApple(): Promise<AuthResult> {
  try {
    console.log('🍎 Starting Apple OAuth sign-in...')
    
    // Check if Apple Authentication is available (iOS only)
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Apple Sign In is only available on iOS devices'
      }
    }
    
    const isAvailable = await AppleAuthentication.isAvailableAsync()
    if (!isAvailable) {
      return {
        success: false,
        error: 'Apple Sign In is not available on this device'
      }
    }
    
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })
    
    console.log('🍎 Apple credential received:', {
      user: credential.user,
      email: credential.email,
      fullName: credential.fullName
    })
    
    // Sign in to Supabase with Apple ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken!,
    })
    
    if (error) {
      console.error('❌ Apple OAuth error:', error)
      return {
        success: false,
        error: getErrorMessage(error)
      }
    }
    
    console.log('✅ Apple OAuth successful')
    
    // Update profile with full name if provided (Apple only provides this on first sign-in)
    if (credential.fullName && data.user) {
      const fullName = [
        credential.fullName.givenName,
        credential.fullName.familyName
      ].filter(Boolean).join(' ')
      
      if (fullName) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', data.user.id)
      }
    }
    
    return {
      success: true,
      data: data.session
    }
  } catch (error: any) {
    console.error('💥 Apple OAuth exception:', error)
    
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'Sign in was cancelled'
      }
    }
    
    return {
      success: false,
      error: getErrorMessage(error)
    }
  }
}