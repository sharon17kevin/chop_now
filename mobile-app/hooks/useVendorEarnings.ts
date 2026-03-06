import { useQuery } from '@tanstack/react-query';
import { OrderService } from '@/services/orders';

interface EarningsData {
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  revenueGrowth: number;
  ordersGrowth: number;
  fundsInEscrow: number;
}

export function useVendorEarnings(vendorId?: string) {
  return useQuery({
    queryKey: ['vendor-earnings', vendorId],
    queryFn: async (): Promise<EarningsData> => {
      if (!vendorId) {
        return {
          totalRevenue: 0,
          monthlyRevenue: 0,
          averageOrderValue: 0,
          totalOrders: 0,
          revenueGrowth: 0,
          ordersGrowth: 0,
          fundsInEscrow: 0,
        };
      }

      const orders = await OrderService.getVendorOrdersWithEarnings(vendorId);

      // Calculate total revenue from delivered orders
      const deliveredOrders = orders.filter(o => o.status === 'delivered');
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.vendor_payout_amount || o.total * 0.95), 0);
      const totalOrders = deliveredOrders.length;

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const monthlyOrders = deliveredOrders.filter(
        o => new Date(o.created_at) >= thirtyDaysAgo
      );
      const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + Number(o.vendor_payout_amount || o.total * 0.95), 0);

      // Calculate growth (current 30 days vs previous 30 days)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const previousMonthOrders = deliveredOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
      });

      const previousMonthRevenue = previousMonthOrders.reduce((sum, o) => sum + Number(o.vendor_payout_amount || o.total * 0.95), 0);
      const previousMonthCount = previousMonthOrders.length;

      const revenueGrowth = previousMonthRevenue > 0
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : monthlyRevenue > 0 ? 100 : 0;

      const ordersGrowth = previousMonthCount > 0
        ? ((monthlyOrders.length - previousMonthCount) / previousMonthCount) * 100
        : monthlyOrders.length > 0 ? 100 : 0;

      // Calculate escrow amounts
      const fundsInEscrow = orders
        .filter(o => o.escrow_status === 'held')
        .reduce((sum, o) => sum + Number(o.vendor_payout_amount || 0), 0);

      return {
        totalRevenue,
        monthlyRevenue,
        averageOrderValue,
        totalOrders,
        revenueGrowth,
        ordersGrowth,
        fundsInEscrow,
      };
    },
    enabled: !!vendorId,
    staleTime: 30000,
  });
}
