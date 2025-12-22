import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: 'customer' | 'vendor' | 'admin' | null
  created_at?: string
  updated_at?: string
  
  // Basic profile fields
  phone?: string
  address?: string
  profile_image?: string
  banner_image?: string
  bio?: string
  date_of_birth?: string
  
  // Location fields
  city?: string
  state?: string
  country?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  
  // Vendor-specific fields
  farm_name?: string
  farm_location?: string
  farm_description?: string
  business_phone?: string
  verified?: boolean
  business_hours?: Record<string, any>
  delivery_zones?: string[]
  
  // Stats and engagement
  rating?: number
  total_orders?: number
  total_sales?: number
  favorite_count?: number
  notification_preferences?: {
    push?: boolean
    email?: boolean
    sms?: boolean
  }
  is_active?: boolean
  last_login?: string
  
  // Social media
  social_media?: Record<string, string>
}

interface VendorApplication {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  rejection_reason?: string
}

interface UserStore {
  profile: UserProfile | null
  isLoadingProfile: boolean
  vendorApplication: VendorApplication | null
  isLoadingApplication: boolean
  
  // Actions
  fetchProfile: (userId: string) => Promise<void>
  fetchVendorApplication: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => void
  clearProfile: () => void
  
  // Convenience getters
  hasRole: (role: 'customer' | 'vendor' | 'admin') => boolean
  isVendor: () => boolean
  isAdmin: () => boolean
  hasPendingApplication: () => boolean
  isApplicationRejected: () => boolean
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  isLoadingProfile: false,
  vendorApplication: null,
  isLoadingApplication: false,

  fetchProfile: async (userId: string) => {
    console.log('👤 [useUserStore] Starting fetchProfile for userId:', userId)
    
    if (!userId) {
      console.error('❌ [useUserStore] No userId provided')
      set({ profile: null, isLoadingProfile: false })
      return
    }

    set({ isLoadingProfile: true })

    try {
      console.log('📡 [useUserStore] Querying profiles table...')
      
      // Remove timeout race - let the query complete naturally
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

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
        full_name: data.full_name
      })

      set({ profile: data, isLoadingProfile: false })
      
      // Auto-fetch vendor application if user is a vendor
      if (data.role === 'vendor') {
        get().fetchVendorApplication(userId)
      }
    } catch (error: any) {
      console.error('💥 [useUserStore] fetchProfile exception:', error)
      set({ profile: null, isLoadingProfile: false })
    }
  },

  fetchVendorApplication: async (userId: string) => {
    if (!userId) return

    set({ isLoadingApplication: true })

    try {
      const { data, error } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      set({ vendorApplication: data, isLoadingApplication: false })
    } catch (error) {
      console.error('Error fetching vendor application:', error)
      set({ vendorApplication: null, isLoadingApplication: false })
    }
  },

  updateProfile: (updates: Partial<UserProfile>) => {
    const current = get().profile
    if (current) {
      set({ profile: { ...current, ...updates } })
    }
  },

  clearProfile: () => {
    set({ profile: null, isLoadingProfile: false, vendorApplication: null, isLoadingApplication: false })
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

  hasPendingApplication: () => {
    return get().vendorApplication?.status === 'pending'
  },

  isApplicationRejected: () => {
    return get().vendorApplication?.status === 'rejected'
  },
}))
