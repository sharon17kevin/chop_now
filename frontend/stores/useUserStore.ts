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
    set({ isLoadingProfile: true })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, created_at')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        set({ profile: null, isLoadingProfile: false })
        return
      }

      set({ profile: data, isLoadingProfile: false })
    } catch (error) {
      console.error('Exception fetching profile:', error)
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
