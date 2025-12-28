import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';

export interface Order {
  id: string;
  user_id: string;
  vendor_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'delivered' | 'cancelled';
  delivery_address: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
  payment_reference?: string;
  payment_status?: string;
  payment_amount?: number;
  refund_status?: string;
  refund_amount?: number;
  refund_method?: string;
  refunded_at?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  profiles?: {
    full_name: string;
  };
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  unit: string;
}

export interface CartGroup {
  vendor_id: string;
  vendor_name: string;
  items: CartItem[];
  total: number;
}

interface UseOrdersReturn {
  // Active cart (pending checkout)
  activeCartGroups: CartGroup[];
  
  // Ongoing orders
  ongoingOrders: Order[];
  
  // Completed orders
  completedOrders: Order[];
  
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  handleRefresh: () => Promise<void>;
}

export const useOrders = (): UseOrdersReturn => {
  const [activeCartGroups, setActiveCartGroups] = useState<CartGroup[]>([]);
  const [ongoingOrders, setOngoingOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      // Get user from Zustand store (already authenticated)
      const profile = useUserStore.getState().profile;
      
      if (!profile?.id) {
        console.warn('⚠️ No user profile found in store');
        setActiveCartGroups([]);
        setOngoingOrders([]);
        setCompletedOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const userId = profile.id;
      console.log('🔍 Fetching orders for user:', userId);

      // ===== FETCH ACTIVE CART ITEMS (pending checkout) =====
      try {
        const { data: cartData, error: cartError } = await supabase
          .from('cart_items')
          .select(
            `
            *,
            products:product_id (
              id,
              name,
              price,
              image_url,
              unit,
              vendor_id,
              profiles:vendor_id (full_name)
            )
          `
          )
          .eq('user_id', userId);

        if (cartError) {
          console.error('❌ Cart fetch error:', cartError);
          throw cartError;
        }

        // Group cart items by vendor
        const groupedByVendor = (cartData || []).reduce((acc, item: any) => {
          try {
            const product = item.products;
            if (!product) {
              console.warn('⚠️ Product not found for cart item:', item.id);
              return acc;
            }

            const vendorId = product.vendor_id;
            const vendorName = product.profiles?.full_name || 'Unknown Vendor';

            if (!acc[vendorId]) {
              acc[vendorId] = {
                vendor_id: vendorId,
                vendor_name: vendorName,
                items: [],
                total: 0,
              };
            }

            const cartItem: CartItem = {
              id: item.id,
              product_id: item.product_id,
              name: product.name,
              price: product.price,
              quantity: item.quantity,
              image_url: product.image_url,
              unit: product.unit,
            };

            acc[vendorId].items.push(cartItem);
            acc[vendorId].total += cartItem.price * cartItem.quantity;

            return acc;
          } catch (err) {
            console.error('❌ Error processing cart item:', err);
            return acc;
          }
        }, {} as Record<string, CartGroup>);

        setActiveCartGroups(Object.values(groupedByVendor));
        console.log('✅ Cart loaded:', Object.keys(groupedByVendor).length, 'vendor groups');
      } catch (cartErr) {
        console.error('❌ Error fetching cart items:', cartErr);
        // Don't throw - cart might not have items yet
        setActiveCartGroups([]);
      }

      // ===== FETCH ONGOING ORDERS (confirmed/processing/pending) =====
      try {
        const { data: ongoingData, error: ongoingError } = await supabase
          .from('orders')
          .select(
            `
            *,
            profiles:vendor_id (full_name)
          `
          )
          .eq('user_id', userId)
          .in('status', ['pending', 'confirmed', 'processing'])
          .order('created_at', { ascending: false });

        if (ongoingError) {
          console.error('❌ Ongoing orders fetch error:', ongoingError);
          throw ongoingError;
        }

        setOngoingOrders((ongoingData as Order[]) || []);
        console.log('✅ Ongoing orders loaded:', ongoingData?.length || 0);
      } catch (ongoingErr) {
        console.error('❌ Error fetching ongoing orders:', ongoingErr);
        setOngoingOrders([]);
      }

      // ===== FETCH COMPLETED ORDERS (delivered/cancelled) =====
      try {
        const { data: completedData, error: completedError } = await supabase
          .from('orders')
          .select(
            `
            *,
            profiles:vendor_id (full_name)
          `
          )
          .eq('user_id', userId)
          .in('status', ['delivered', 'cancelled'])
          .order('created_at', { ascending: false });

        if (completedError) {
          console.error('❌ Completed orders fetch error:', completedError);
          throw completedError;
        }

        setCompletedOrders((completedData as Order[]) || []);
        console.log('✅ Completed orders loaded:', completedData?.length || 0);
      } catch (completedErr) {
        console.error('❌ Error fetching completed orders:', completedErr);
        setCompletedOrders([]);
      }

      console.log('✅ All orders fetched successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch orders';
      console.error('❌ useOrders error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchOrders(true);
  };

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    activeCartGroups,
    ongoingOrders,
    completedOrders,
    loading,
    refreshing,
    error,
    handleRefresh,
  };
};
