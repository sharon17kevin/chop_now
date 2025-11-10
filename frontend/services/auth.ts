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
  
  return error.message || 'Something went wrong. Please try again'
}

export async function signUp(
  email: string, 
  password: string, 
  name?: string,
  role: 'customer' | 'vendor' = 'customer'
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role } // stored in user_metadata
      }
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
    console.error('Signup exception:', error)
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