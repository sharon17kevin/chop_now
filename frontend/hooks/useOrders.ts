import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  profiles?: {
    full_name: string;
  };
}

interface UseOrdersReturn {
  orders: Order[];
  activeOrders: Order[];
  ongoingOrders: Order[];
  completedOrders: Order[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  handleRefresh: () => Promise<void>;
}

export const useOrders = (): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
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

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Fetch orders for current user with vendor information
      const { data: userOrders, error: queryError } = await supabase
        .from('orders')
        .select(
          `
          *,
          profiles:vendor_id (full_name)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      if (userOrders) {
        setOrders(userOrders as Order[]);
        console.log('✅ Fetched', userOrders.length, 'orders');
      } else {
        setOrders([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch orders';
      console.error('Error fetching orders:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchOrders(true);
  };

  // Filter orders by status
  const activeOrders = orders.filter((o) => o.status === 'pending');
  const ongoingOrders = orders.filter(
    (o) =>
      o.status === 'confirmed' ||
      o.status === 'processing' ||
      o.status === 'cancelled'
  );
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    activeOrders,
    ongoingOrders,
    completedOrders,
    loading,
    refreshing,
    error,
    handleRefresh,
  };
};
