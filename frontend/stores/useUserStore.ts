import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string
  name?: string
  role: 'customer' | 'vendor' | 'admin' | null
  created_at?: string
}

interface UserStore {
  profile: UserProfile | null
  isLoadingProfile: boolean
  
  // Actions
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => void
  clearProfile: () => void
  
  // Convenience getters
  hasRole: (role: 'customer' | 'vendor' | 'admin') => boolean
  isVendor: () => boolean
  isAdmin: () => boolean
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  isLoadingProfile: false,

  fetchProfile: async (userId: string) => {
    console.log('👤 [useUserStore] Starting fetchProfile for userId:', userId)
    
    if (!userId) {
      console.error('❌ [useUserStore] No userId provided')
      set({ profile: null, isLoadingProfile: false })
      return
    }

    set({ isLoadingProfile: true })
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout after 8 seconds')), 8000)
    })

    // Create the fetch promise
    const fetchPromise = supabase
      .from('profiles')
      .select('id, email, name, role, created_at')
      .eq('id', userId)
      .single()

    try {
      console.log('📡 [useUserStore] Querying profiles table...')
      
      // Race between fetch and timeout
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any

      console.log('📊 [useUserStore] Query result:', { 
        hasData: !!data, 
        hasError: !!error,
        data,
        error 
      })

      if (error) {
        console.error('❌ [useUserStore] Supabase error:', error)
        
        if (error.code === 'PGRST116') {
          console.error('🚫 [useUserStore] Profile not found - 0 rows returned')
          console.error('💡 [useUserStore] Check if profile exists: SELECT * FROM profiles WHERE id =', userId)
        }
        
        set({ profile: null, isLoadingProfile: false })
        return
      }

      if (!data) {
        console.error('❌ [useUserStore] No profile data returned')
        set({ profile: null, isLoadingProfile: false })
        return
      }

      console.log('✅ [useUserStore] Profile fetched successfully:', {
        id: data.id,
        email: data.email,
        role: data.role,
        name: data.name
      })

      set({ profile: data, isLoadingProfile: false })
    } catch (error: any) {
      console.error('💥 [useUserStore] fetchProfile exception:', error)
      
      if (error.message?.includes('timeout')) {
        console.error('⏱️ [useUserStore] Profile fetch timed out - likely RLS policy blocking access')
      }
      
      set({ profile: null, isLoadingProfile: false })
    }
  },

  updateProfile: (updates: Partial<UserProfile>) => {
    const current = get().profile
    if (current) {
      set({ profile: { ...current, ...updates } })
    }
  },

  clearProfile: () => {
    set({ profile: null, isLoadingProfile: false })
  },

  // Convenience helpers for role checks
  hasRole: (role: 'customer' | 'vendor' | 'admin') => {
    const profile = get().profile
    return profile?.role === role
  },

  isVendor: () => {
    return get().hasRole('vendor')
  },

  isAdmin: () => {
    return get().hasRole('admin')
  },
}))
