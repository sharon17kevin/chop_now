import { useUserStore } from '../stores/useUserStore'

/**
 * Convenience hook for accessing user role information
 * 
 * @example
 * ```tsx
 * function VendorScreen() {
 *   const { role, isVendor, isAdmin, hasRole } = useRole()
 *   
 *   if (!isVendor) {
 *     return <AccessDenied />
 *   }
 *   
 *   return <VendorDashboard />
 * }
 * ```
 */
export function useRole() {
  const profile = useUserStore((state) => state.profile)
  const isLoadingProfile = useUserStore((state) => state.isLoadingProfile)
  const hasRole = useUserStore((state) => state.hasRole)
  const isVendor = useUserStore((state) => state.isVendor)
  const isAdmin = useUserStore((state) => state.isAdmin)

  return {
    // Current role
    role: profile?.role ?? null,
    
    // User info
    profile,
    isLoadingProfile,
    
    // Convenience checks
    hasRole,
    isVendor: isVendor(),
    isAdmin: isAdmin(),
    isCustomer: hasRole('customer'),
    
    // Role requirements
    requireVendor: () => {
      if (!isVendor()) {
        throw new Error('Vendor access required')
      }
    },
    requireAdmin: () => {
      if (!isAdmin()) {
        throw new Error('Admin access required')
      }
    },
  }
}
