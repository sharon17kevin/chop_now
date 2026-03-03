import { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { OrderService } from '@/services/orders';
import { CartService } from '@/services/cart';

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
  activeCartGroups: CartGroup[];
  ongoingOrders: Order[];
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

      const profile = useUserStore.getState().profile;

      if (!profile?.id) {
        console.warn('No user profile found in store');
        setActiveCartGroups([]);
        setOngoingOrders([]);
        setCompletedOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const userId = profile.id;

      // Fetch active cart items
      try {
        const cartData = await CartService.getCartItems(userId);

        const groupedByVendor = (cartData || []).reduce((acc, item: any) => {
          try {
            const product = item.products;
            if (!product) {
              console.warn('Product not found for cart item:', item.id);
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
            console.error('Error processing cart item:', err);
            return acc;
          }
        }, {} as Record<string, CartGroup>);

        setActiveCartGroups(Object.values(groupedByVendor));
      } catch (cartErr) {
        console.error('Error fetching cart items:', cartErr);
        setActiveCartGroups([]);
      }

      // Fetch ongoing orders
      try {
        const ongoingData = await OrderService.getOngoingOrders(userId);
        setOngoingOrders((ongoingData as Order[]) || []);
      } catch (ongoingErr) {
        console.error('Error fetching ongoing orders:', ongoingErr);
        setOngoingOrders([]);
      }

      // Fetch completed orders
      try {
        const completedData = await OrderService.getCompletedOrders(userId);
        setCompletedOrders((completedData as Order[]) || []);
      } catch (completedErr) {
        console.error('Error fetching completed orders:', completedErr);
        setCompletedOrders([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch orders';
      console.error('useOrders error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchOrders(true);
  };

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
