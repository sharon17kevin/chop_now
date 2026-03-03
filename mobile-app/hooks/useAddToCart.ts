import { useState } from 'react';
import { Alert } from 'react-native';
import { useUserStore } from '@/stores/useUserStore';
import { CartService } from '@/services/cart';

interface AddToCartOptions {
  productId: string;
  productName: string;
  quantity?: number;
  isAvailable?: boolean;
  stock?: number;
}

export function useAddToCart() {
  const [addingToCart, setAddingToCart] = useState(false);

  const addToCart = async (options: AddToCartOptions) => {
    const {
      productId,
      productName,
      quantity = 1,
      isAvailable = true,
      stock = 1,
    } = options;

    if (!isAvailable || stock === 0) {
      Alert.alert('Unavailable', 'This product is currently out of stock');
      return false;
    }

    try {
      setAddingToCart(true);
      const userId = useUserStore.getState().profile?.id;

      if (!userId) {
        Alert.alert('Login Required', 'Please log in to add items to cart');
        return false;
      }

      const existing = await CartService.getExistingCartItem(userId, productId);

      if (existing) {
        await CartService.updateQuantity(existing.id, existing.quantity + quantity);
      } else {
        await CartService.addItem(userId, productId, quantity);
      }

      Alert.alert('Success', `Added ${productName} to cart!`);
      return true;
    } catch (err) {
      console.error('Error adding to cart:', err);
      Alert.alert('Error', 'Failed to add to cart');
      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  return { addToCart, addingToCart };
}
