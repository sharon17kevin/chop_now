import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';

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

      // Check if already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (existing) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
      } else {
        // Add new item
        await supabase.from('cart_items').insert({
          user_id: userId,
          product_id: productId,
          quantity: quantity,
        });
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
