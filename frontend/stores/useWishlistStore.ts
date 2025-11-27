import { create } from 'zustand';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

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

    // Prevent duplicate fetches for the same user
    if (isFetching || lastFetchedUserId === userId) {
      console.log('⏭️ Skipping duplicate wishlist fetch for user:', userId);
      return;
    }

    try {
      set({ loading: true, isFetching: true, lastFetchedUserId: userId });
      console.log('📋 Fetching wishlist for user:', userId);

      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', userId);

      if (error) throw error;

      const ids = new Set(data?.map((w) => w.product_id) || []);
      set({ wishlistIds: ids });
      
      // Update profile favorite count with actual count
      updateProfile(ids.size);
      
      console.log('✅ Wishlist loaded:', ids.size, 'items');
    } catch (err) {
      console.error('❌ Error fetching wishlist:', err);
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

    console.log(
      isInWishlist ? '🗑️ Removing from wishlist:' : '➕ Adding to wishlist:',
      productId
    );

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

    // Update profile count optimistically
    const newCount = currentFavoriteCount + (isInWishlist ? -1 : 1);
    updateProfile(newCount);

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .match({ user_id: userId, product_id: productId });

        if (error) throw error;
        console.log('✅ Removed from wishlist');
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: userId, product_id: productId });

        if (error) throw error;
        console.log('✅ Added to wishlist');
      }

      return true;
    } catch (err: any) {
      console.error('❌ Wishlist toggle error:', err);

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

      // Rollback profile count
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
