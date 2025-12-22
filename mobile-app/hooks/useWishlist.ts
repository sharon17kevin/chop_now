import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useUserStore } from '@/stores/useUserStore';
import { useWishlistStore } from '@/stores/useWishlistStore';

interface UseWishlistReturn {
  wishlistIds: Set<string>;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  loading: boolean;
}

/**
 * Hook for managing user's wishlist
 * Uses Zustand store to prevent duplicate fetches
 * Integrates with useUserStore for authentication and profile updates
 */
export const useWishlist = (): UseWishlistReturn => {
  const { profile, updateProfile } = useUserStore();
  const {
    wishlistIds,
    loading,
    fetchWishlist,
    toggleWishlist: storeToggle,
    isInWishlist,
    clearWishlist,
  } = useWishlistStore();

  // Fetch wishlist when user changes
  useEffect(() => {
    if (profile?.id) {
      const updateFavoriteCount = (count: number) => {
        updateProfile({ favorite_count: count });
      };
      fetchWishlist(profile.id, updateFavoriteCount);
    } else {
      clearWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    if (!profile?.id) {
      Alert.alert(
        'Sign in required',
        'Please sign in to save items to your wishlist',
        [{ text: 'OK' }]
      );
      return false;
    }

    const updateFavoriteCount = (count: number) => {
      updateProfile({ favorite_count: count });
    };

    return storeToggle(
      productId,
      profile.id,
      profile.favorite_count || 0,
      updateFavoriteCount
    );
  };

  const refetch = async () => {
    if (profile?.id) {
      const updateFavoriteCount = (count: number) => {
        updateProfile({ favorite_count: count });
      };
      await fetchWishlist(profile.id, updateFavoriteCount);
    }
  };

  return {
    wishlistIds,
    isInWishlist,
    toggleWishlist,
    refetch,
    loading,
  };
};

export default useWishlist;
