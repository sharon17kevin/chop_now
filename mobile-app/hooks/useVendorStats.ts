import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface OrdersByStatus {
  pending: number;
  confirmed: number;
  processing: number;
  delivered: number;
  cancelled: number;
}

interface TopProduct {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
  image_url?: string;
}

interface VendorStats {
  ordersByStatus: OrdersByStatus;
  topProducts: TopProduct[];
  uniqueCustomers: number;
  lowStockCount: number;
}

export function useVendorStats(vendorId?: string) {
  return useQuery({
    queryKey: ['vendor-stats', vendorId],
    queryFn: async (): Promise<VendorStats> => {
      if (!vendorId) {
        return {
          ordersByStatus: { pending: 0, confirmed: 0, processing: 0, delivered: 0, cancelled: 0 },
          topProducts: [],
          uniqueCustomers: 0,
          lowStockCount: 0,
        };
      }

      // Fetch orders for status breakdown
      const { data: orders } = await supabase
        .from('orders')
        .select('id, user_id, status')
        .eq('vendor_id', vendorId);

      // Calculate orders by status
      const ordersByStatus: OrdersByStatus = {
        pending: orders?.filter(o => o.status === 'pending').length || 0,
        confirmed: orders?.filter(o => o.status === 'confirmed').length || 0,
        processing: orders?.filter(o => o.status === 'processing').length || 0,
        delivered: orders?.filter(o => o.status === 'delivered').length || 0,
        cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
      };

      // Calculate unique customers
      const uniqueCustomers = new Set(orders?.map(o => o.user_id) || []).size;

      // Fetch top products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          products!inner(name, image_url, vendor_id),
          orders!inner(status, vendor_id)
        `)
        .eq('orders.vendor_id', vendorId)
        .eq('orders.status', 'delivered');

      // Group by product and calculate stats
      const productMap = new Map<string, { name: string; unitsSold: number; revenue: number; image_url?: string }>();
      orderItems?.forEach(item => {
        const product = item.products as any;
        const existing = productMap.get(item.product_id);
        if (existing) {
          existing.unitsSold += item.quantity;
          existing.revenue += item.quantity * item.price;
        } else {
          productMap.set(item.product_id, {
            name: product.name,
            unitsSold: item.quantity,
            revenue: item.quantity * item.price,
            image_url: product.image_url,
          });
        }
      });

      const topProducts: TopProduct[] = Array.from(productMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Fetch low stock count
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .lt('stock', 10)
        .eq('is_available', true);

      return {
        ordersByStatus,
        topProducts,
        uniqueCustomers,
        lowStockCount: lowStockCount || 0,
      };
    },
    enabled: !!vendorId,
    staleTime: 30000,
  });
}
