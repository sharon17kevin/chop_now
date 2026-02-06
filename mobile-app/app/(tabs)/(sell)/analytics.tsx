import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Users,
  Star,
  Package,
  AlertTriangle,
  Lock,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useVendorEarnings } from '@/hooks/useVendorEarnings';
import { useVendorStats } from '@/hooks/useVendorStats';
import { useVendorRating } from '@/hooks/useVendorRating';
import AppHeader from '@/components/AppHeader';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: earnings,
    isLoading: earningsLoading,
    refetch: refetchEarnings,
  } = useVendorEarnings(user?.id);
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useVendorStats(user?.id);
  const { rating, loading: ratingLoading } = useVendorRating(user?.id);

  // Fetch actual wallet balance
  const {
    data: walletBalance,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ['vendor-wallet', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      if (error) {
        // Wallet might not exist yet, return 0
        return 0;
      }
      return data?.balance || 0;
    },
    enabled: !!user?.id,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchEarnings(), refetchStats(), refetchWallet()]);
    setRefreshing(false);
  };

  const isLoading =
    earningsLoading || statsLoading || ratingLoading || walletLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return colors.success;
      case 'processing':
      case 'confirmed':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <AppHeader title="Analytics" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading analytics...
            </Text>
          </View>
        ) : (
          <>
            {/* Key Metrics */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Overview
              </Text>

              {/* Money Status Cards */}
              <View style={styles.escrowRow}>
                <View
                  style={[
                    styles.escrowCard,
                    {
                      backgroundColor: colors.warning + '15',
                      borderColor: colors.warning,
                    },
                  ]}
                >
                  <Lock size={16} color={colors.warning} />
                  <Text
                    style={[
                      styles.escrowLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    In Escrow
                  </Text>
                  <Text style={[styles.escrowValue, { color: colors.warning }]}>
                    ₦{earnings?.fundsInEscrow.toLocaleString() || '0'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.escrowCard,
                    {
                      backgroundColor: colors.success + '15',
                      borderColor: colors.success,
                    },
                  ]}
                >
                  <DollarSign size={16} color={colors.success} />
                  <Text
                    style={[
                      styles.escrowLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Wallet Balance
                  </Text>
                  <Text style={[styles.escrowValue, { color: colors.success }]}>
                    ₦{walletBalance?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                {/* Total Revenue */}
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.metricIcon,
                      { backgroundColor: colors.success + '20' },
                    ]}
                  >
                    <DollarSign size={20} color={colors.success} />
                  </View>
                  <Text
                    style={[
                      styles.metricLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Total Revenue
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    ₦{earnings?.totalRevenue.toLocaleString() || '0'}
                  </Text>
                  {earnings && earnings.revenueGrowth !== 0 && (
                    <View style={styles.growthRow}>
                      {earnings.revenueGrowth > 0 ? (
                        <TrendingUp size={12} color={colors.success} />
                      ) : (
                        <TrendingDown size={12} color={colors.error} />
                      )}
                      <Text
                        style={[
                          styles.growthText,
                          {
                            color:
                              earnings.revenueGrowth > 0
                                ? colors.success
                                : colors.error,
                          },
                        ]}
                      >
                        {Math.abs(earnings.revenueGrowth).toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* Monthly Revenue */}
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.metricIcon,
                      { backgroundColor: colors.primary + '20' },
                    ]}
                  >
                    <DollarSign size={20} color={colors.primary} />
                  </View>
                  <Text
                    style={[
                      styles.metricLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Last 30 Days
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    ₦{earnings?.monthlyRevenue.toLocaleString() || '0'}
                  </Text>
                </View>

                {/* Total Orders */}
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.metricIcon,
                      { backgroundColor: colors.warning + '20' },
                    ]}
                  >
                    <ShoppingBag size={20} color={colors.warning} />
                  </View>
                  <Text
                    style={[
                      styles.metricLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Total Orders
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {earnings?.totalOrders || 0}
                  </Text>
                  {earnings && earnings.ordersGrowth !== 0 && (
                    <View style={styles.growthRow}>
                      {earnings.ordersGrowth > 0 ? (
                        <TrendingUp size={12} color={colors.success} />
                      ) : (
                        <TrendingDown size={12} color={colors.error} />
                      )}
                      <Text
                        style={[
                          styles.growthText,
                          {
                            color:
                              earnings.ordersGrowth > 0
                                ? colors.success
                                : colors.error,
                          },
                        ]}
                      >
                        {Math.abs(earnings.ordersGrowth).toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* Average Order Value */}
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.metricIcon,
                      { backgroundColor: colors.secondary + '20' },
                    ]}
                  >
                    <Package size={20} color={colors.secondary} />
                  </View>
                  <Text
                    style={[
                      styles.metricLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Avg Order
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    ₦{earnings?.averageOrderValue.toFixed(0) || '0'}
                  </Text>
                </View>

                {/* Rating */}
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.metricIcon,
                      { backgroundColor: '#FCD34D20' },
                    ]}
                  >
                    <Star size={20} color="#FCD34D" />
                  </View>
                  <Text
                    style={[
                      styles.metricLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Rating
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {rating?.average.toFixed(1) || '0.0'}
                  </Text>
                  <Text
                    style={[
                      styles.metricSubtext,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {rating?.total || 0} reviews
                  </Text>
                </View>

                {/* Unique Customers */}
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.metricIcon,
                      { backgroundColor: colors.primary + '20' },
                    ]}
                  >
                    <Users size={20} color={colors.primary} />
                  </View>
                  <Text
                    style={[
                      styles.metricLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Customers
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {stats?.uniqueCustomers || 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Low Stock Alert */}
            {stats && stats.lowStockCount > 0 && (
              <TouchableOpacity
                style={[
                  styles.alertBanner,
                  {
                    backgroundColor: colors.warning + '15',
                    borderColor: colors.warning,
                  },
                ]}
                onPress={() => router.push('/(tabs)/(sell)/stock')}
              >
                <View
                  style={[
                    styles.alertIcon,
                    { backgroundColor: colors.warning },
                  ]}
                >
                  <AlertTriangle size={20} color="#FFF" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>
                    Low Stock Alert
                  </Text>
                  <Text
                    style={[styles.alertText, { color: colors.textSecondary }]}
                  >
                    {stats.lowStockCount} product
                    {stats.lowStockCount > 1 ? 's' : ''} running low on stock
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Orders by Status */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Orders by Status
              </Text>
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {Object.entries(stats?.ordersByStatus || {}).map(
                  ([status, count]) => (
                    <View key={status} style={styles.statusRow}>
                      <View style={styles.statusLeft}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(status) },
                          ]}
                        />
                        <Text
                          style={[styles.statusLabel, { color: colors.text }]}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </View>
                      <Text
                        style={[styles.statusCount, { color: colors.text }]}
                      >
                        {count}
                      </Text>
                    </View>
                  ),
                )}
              </View>
            </View>

            {/* Top Products */}
            {stats && stats.topProducts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Top Products
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/(sell)/stock')}
                  >
                    <Text
                      style={[styles.seeAllText, { color: colors.primary }]}
                    >
                      See All
                    </Text>
                  </TouchableOpacity>
                </View>
                {stats.topProducts.map((product, index) => (
                  <View
                    key={product.id}
                    style={[
                      styles.productRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={styles.productLeft}>
                      <Text
                        style={[
                          styles.productRank,
                          { color: colors.textSecondary },
                        ]}
                      >
                        #{index + 1}
                      </Text>
                      {product.image_url ? (
                        <Image
                          source={{ uri: product.image_url }}
                          style={styles.productImage}
                        />
                      ) : (
                        <View
                          style={[
                            styles.productImagePlaceholder,
                            { backgroundColor: colors.filter },
                          ]}
                        >
                          <Package size={20} color={colors.textSecondary} />
                        </View>
                      )}
                      <View style={styles.productInfo}>
                        <Text
                          style={[styles.productName, { color: colors.text }]}
                        >
                          {product.name}
                        </Text>
                        <Text
                          style={[
                            styles.productUnits,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {product.unitsSold} units sold
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.productRevenue, { color: colors.success }]}
                    >
                      ₦{product.revenue.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 11,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 14,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  statusCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productRank: {
    fontSize: 14,
    fontWeight: '700',
    width: 28,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  productUnits: {
    fontSize: 13,
  },
  productRevenue: {
    fontSize: 15,
    fontWeight: '700',
  },
  escrowRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  escrowCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  escrowLabel: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 2,
  },
  escrowValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
