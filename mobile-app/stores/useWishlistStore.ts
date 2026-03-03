import { create } from 'zustand';
import { Alert } from 'react-native';
import { WishlistService } from '@/services/wishlist';

interface WishlistState {
  wishlistIds: Set<string>;
  loading: boolean;
  lastFetchedUserId: string | null;
  isFetching: boolean;
  fetchWishlist: (userId: string, updateProfile: (count: number) => void) => Promise<void>;
  toggleWishlist: (
    productId: string,
    userId: string,
    currentFavoriteCount: number,
    updateProfile: (count: number) => void
  ) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlistIds: new Set(),
  loading: false,
  lastFetchedUserId: null,
  isFetching: false,

  fetchWishlist: async (userId: string, updateProfile: (count: number) => void) => {
    const { lastFetchedUserId, isFetching } = get();

    if (isFetching || lastFetchedUserId === userId) {
      return;
    }

    try {
      set({ loading: true, isFetching: true, lastFetchedUserId: userId });

      const productIds = await WishlistService.getByUser(userId);
      const ids = new Set(productIds);
      set({ wishlistIds: ids });

      updateProfile(ids.size);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      set({ loading: false, isFetching: false });
    }
  },

  toggleWishlist: async (
    productId: string,
    userId: string,
    currentFavoriteCount: number,
    updateProfile: (count: number) => void
  ) => {
    const { wishlistIds } = get();
    const isInWishlist = wishlistIds.has(productId);

    // Optimistic update
    set((state) => {
      const newIds = new Set(state.wishlistIds);
      if (isInWishlist) {
        newIds.delete(productId);
      } else {
        newIds.add(productId);
      }
      return { wishlistIds: newIds };
    });

    const newCount = currentFavoriteCount + (isInWishlist ? -1 : 1);
    updateProfile(newCount);

    try {
      if (isInWishlist) {
        await WishlistService.remove(userId, productId);
      } else {
        await WishlistService.add(userId, productId);
      }

      return true;
    } catch (err: any) {
      console.error('Wishlist toggle error:', err);

      // Rollback on error
      set((state) => {
        const newIds = new Set(state.wishlistIds);
        if (isInWishlist) {
          newIds.add(productId);
        } else {
          newIds.delete(productId);
        }
        return { wishlistIds: newIds };
      });

      updateProfile(currentFavoriteCount);

      Alert.alert('Error', 'Failed to update wishlist. Please try again.');
      return false;
    }
  },

  isInWishlist: (productId: string) => {
    return get().wishlistIds.has(productId);
  },

  clearWishlist: () => {
    set({ wishlistIds: new Set(), lastFetchedUserId: null, isFetching: false });
  },
}));
