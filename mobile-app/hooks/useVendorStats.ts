import { useQuery } from '@tanstack/react-query';
import { OrderService } from '@/services/orders';
import { ProductService } from '@/services/products';

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
      const orders = await OrderService.getVendorOrders(vendorId);

      const ordersByStatus: OrdersByStatus = {
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        processing: orders.filter(o => o.status === 'processing').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
      };

      const uniqueCustomers = new Set(orders.map(o => o.user_id)).size;

      // Fetch top products
      const orderItems = await OrderService.getVendorTopProducts(vendorId);

      // Group by product and calculate stats
      const productMap = new Map<string, { name: string; unitsSold: number; revenue: number; image_url?: string }>();
      orderItems.forEach(item => {
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
      const lowStockCount = await ProductService.getLowStockCount(vendorId);

      return {
        ordersByStatus,
        topProducts,
        uniqueCustomers,
        lowStockCount,
      };
    },
    enabled: !!vendorId,
    staleTime: 30000,
  });
}
