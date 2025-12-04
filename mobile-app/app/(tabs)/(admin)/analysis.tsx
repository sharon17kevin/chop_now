import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  DollarSign,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AnalyticsData {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  activeVendors: number;
  vendorsGrowth: number;
  totalProducts: number;
  productsGrowth: number;
  averageOrderValue: number;
  topVendors: {
    vendor_id: string;
    vendor_name: string;
    total_sales: number;
    order_count: number;
  }[];
  topProducts: {
    product_id: string;
    product_name: string;
    sales_count: number;
    revenue: number;
  }[];
  ordersByStatus: {
    status: string;
    count: number;
  }[];
}

export default function Analysis() {
  const { colors } = useTheme();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    activeVendors: 0,
    vendorsGrowth: 0,
    totalProducts: 0,
    productsGrowth: 0,
    averageOrderValue: 0,
    topVendors: [],
    topProducts: [],
    ordersByStatus: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch total orders and revenue
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, created_at, status');

      if (ordersError) throw ordersError;

      const totalRevenue =
        orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate growth (comparing last 7 days vs previous 7 days)
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const recentOrders =
        orders?.filter((o) => new Date(o.created_at) >= last7Days).length || 0;
      const previousOrders =
        orders?.filter(
          (o) =>
            new Date(o.created_at) >= previous7Days &&
            new Date(o.created_at) < last7Days
        ).length || 0;

      const ordersGrowth =
        previousOrders > 0
          ? ((recentOrders - previousOrders) / previousOrders) * 100
          : 0;

      // Fetch active vendors
      const { count: vendorsCount, error: vendorsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'vendor')
        .eq('verified', true);

      if (vendorsError) throw vendorsError;

      // Fetch total products
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true);

      if (productsError) throw productsError;

      // Fetch orders by status
      const ordersByStatus = [
        {
          status: 'pending',
          count: orders?.filter((o) => o.status === 'pending').length || 0,
        },
        {
          status: 'confirmed',
          count: orders?.filter((o) => o.status === 'confirmed').length || 0,
        },
        {
          status: 'processing',
          count: orders?.filter((o) => o.status === 'processing').length || 0,
        },
        {
          status: 'delivered',
          count: orders?.filter((o) => o.status === 'delivered').length || 0,
        },
        {
          status: 'cancelled',
          count: orders?.filter((o) => o.status === 'cancelled').length || 0,
        },
      ];

      // Fetch top vendors by sales
      const { data: topVendorsData, error: topVendorsError } = await supabase
        .from('orders')
        .select('vendor_id, total, profiles!orders_vendor_id_fkey(farm_name)')
        .order('total', { ascending: false })
        .limit(5);

      if (topVendorsError) throw topVendorsError;

      // Group by vendor
      const vendorMap = new Map();
      topVendorsData?.forEach((order: any) => {
        const vendorId = order.vendor_id;
        if (!vendorMap.has(vendorId)) {
          vendorMap.set(vendorId, {
            vendor_id: vendorId,
            vendor_name: order.profiles?.farm_name || 'Unknown',
            total_sales: 0,
            order_count: 0,
          });
        }
        const vendor = vendorMap.get(vendorId);
        vendor.total_sales += Number(order.total);
        vendor.order_count += 1;
      });

      const topVendors = Array.from(vendorMap.values())
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 5);

      // Fetch top products
      const { data: topProductsData, error: topProductsError } = await supabase
        .from('order_items')
        .select('product_id, quantity, price, products(name)')
        .order('quantity', { ascending: false })
        .limit(100);

      if (topProductsError) throw topProductsError;

      // Group by product
      const productMap = new Map();
      topProductsData?.forEach((item: any) => {
        const productId = item.product_id;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product_id: productId,
            product_name: item.products?.name || 'Unknown',
            sales_count: 0,
            revenue: 0,
          });
        }
        const product = productMap.get(productId);
        product.sales_count += item.quantity;
        product.revenue += Number(item.price) * item.quantity;
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, 5);

      setAnalytics({
        totalRevenue,
        revenueGrowth: ordersGrowth, // Using orders growth as proxy
        totalOrders,
        ordersGrowth,
        activeVendors: vendorsCount || 0,
        vendorsGrowth: 0, // Would need historical data
        totalProducts: productsCount || 0,
        productsGrowth: 0, // Would need historical data
        averageOrderValue,
        topVendors,
        topProducts,
        ordersByStatus,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    growth,
    color,
    prefix = '',
  }: {
    icon: any;
    label: string;
    value: string | number;
    growth?: number;
    color: string;
    prefix?: string;
  }) => (
    <View
      style={[
        styles.metricCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.metricHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon size={20} color={color} />
        </View>
        {growth !== undefined && growth !== 0 && (
          <View
            style={[
              styles.growthBadge,
              {
                backgroundColor:
                  growth > 0 ? '#10b981' + '20' : '#ef4444' + '20',
              },
            ]}
          >
            {growth > 0 ? (
              <ArrowUp size={12} color="#10b981" />
            ) : (
              <ArrowDown size={12} color="#ef4444" />
            )}
            <Text
              style={[
                styles.growthText,
                { color: growth > 0 ? '#10b981' : '#ef4444' },
              ]}
            >
              {Math.abs(growth).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.metricValue, { color: colors.text }]}>
        {prefix}
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.filter }]}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Analytics & Insights
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.secondary}
          />
        }
      >
        {/* Key Metrics */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Key Metrics
        </Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={DollarSign}
            label="Total Revenue"
            value={`${analytics.totalRevenue.toFixed(2)}`}
            prefix="₦"
            growth={analytics.revenueGrowth}
            color="#10b981"
          />
          <MetricCard
            icon={ShoppingBag}
            label="Total Orders"
            value={analytics.totalOrders}
            growth={analytics.ordersGrowth}
            color="#3b82f6"
          />
          <MetricCard
            icon={Store}
            label="Active Vendors"
            value={analytics.activeVendors}
            growth={analytics.vendorsGrowth}
            color="#8b5cf6"
          />
          <MetricCard
            icon={Package}
            label="Total Products"
            value={analytics.totalProducts}
            growth={analytics.productsGrowth}
            color="#f59e0b"
          />
        </View>

        {/* Average Order Value */}
        <View
          style={[
            styles.avgOrderCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.avgOrderHeader}>
            <TrendingUp size={24} color={colors.secondary} />
            <Text
              style={[styles.avgOrderLabel, { color: colors.textSecondary }]}
            >
              Average Order Value
            </Text>
          </View>
          <Text style={[styles.avgOrderValue, { color: colors.text }]}>
            ₦{analytics.averageOrderValue.toFixed(2)}
          </Text>
        </View>

        {/* Orders by Status */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Orders by Status
        </Text>
        <View
          style={[
            styles.statusCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {analytics.ordersByStatus.map((item, index) => (
            <View key={item.status} style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        item.status === 'delivered'
                          ? '#10b981'
                          : item.status === 'cancelled'
                          ? '#ef4444'
                          : item.status === 'processing'
                          ? '#3b82f6'
                          : '#f59e0b',
                    },
                  ]}
                />
                <Text style={[styles.statusLabel, { color: colors.text }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {item.count}
              </Text>
            </View>
          ))}
        </View>

        {/* Top Vendors */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Top Vendors by Sales
        </Text>
        <View
          style={[
            styles.rankingCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {analytics.topVendors.length > 0 ? (
            analytics.topVendors.map((vendor, index) => (
              <View key={vendor.vendor_id} style={styles.rankRow}>
                <View style={styles.rankLeft}>
                  <View
                    style={[
                      styles.rankBadge,
                      {
                        backgroundColor:
                          index === 0
                            ? '#fbbf24'
                            : index === 1
                            ? '#94a3b8'
                            : index === 2
                            ? '#cd7f32'
                            : colors.filter,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankNumber,
                        { color: index < 3 ? '#fff' : colors.text },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={[styles.rankName, { color: colors.text }]}>
                      {vendor.vendor_name}
                    </Text>
                    <Text
                      style={[
                        styles.rankSubtext,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {vendor.order_count} orders
                    </Text>
                  </View>
                </View>
                <Text style={[styles.rankValue, { color: colors.text }]}>
                  ₦{vendor.total_sales.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No vendor data available
            </Text>
          )}
        </View>

        {/* Top Products */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Top Selling Products
        </Text>
        <View
          style={[
            styles.rankingCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {analytics.topProducts.length > 0 ? (
            analytics.topProducts.map((product, index) => (
              <View key={product.product_id} style={styles.rankRow}>
                <View style={styles.rankLeft}>
                  <View
                    style={[
                      styles.rankBadge,
                      {
                        backgroundColor:
                          index === 0
                            ? '#fbbf24'
                            : index === 1
                            ? '#94a3b8'
                            : index === 2
                            ? '#cd7f32'
                            : colors.filter,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankNumber,
                        { color: index < 3 ? '#fff' : colors.text },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={[styles.rankName, { color: colors.text }]}>
                      {product.product_name}
                    </Text>
                    <Text
                      style={[
                        styles.rankSubtext,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {product.sales_count} units sold
                    </Text>
                  </View>
                </View>
                <Text style={[styles.rankValue, { color: colors.text }]}>
                  ₦{product.revenue.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No product data available
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
  },
  avgOrderCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  avgOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avgOrderLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  avgOrderValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statusCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  rankingCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  rankSubtext: {
    fontSize: 12,
  },
  rankValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
