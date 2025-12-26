import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/stores/useUserStore';
import AppHeader from '@/components/AppHeader';
import {
  Clock,
  Package,
  CheckCircle,
  XCircle,
  User,
  DollarSign,
} from 'lucide-react-native';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
  };
}

interface VendorOrder {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
  profiles: {
    full_name: string;
    phone: string;
  };
}

type TabType = 'pending' | 'processing' | 'delivered' | 'completed';

export default function VendorOrdersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  // Fetch vendor orders
  const {
    data: orders,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vendor-orders', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('No vendor profile');

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          user_id,
          status,
          total,
          created_at,
          order_items (
            id,
            product_id,
            quantity,
            price,
            products!inner (
              name
            )
          ),
          profiles!user_id (
            full_name,
            phone
          )
        `
        )
        .eq('vendor_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as VendorOrder[];
    },
    enabled: !!profile?.id,
  });

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Filter orders by status
  const getFilteredOrders = () => {
    if (!orders) return [];

    switch (activeTab) {
      case 'pending':
        return orders.filter((o) => o.status === 'pending');
      case 'processing':
        return orders.filter(
          (o) => o.status === 'confirmed' || o.status === 'processing'
        );
      case 'delivered':
        return orders.filter((o) => o.status === 'delivered');
      case 'completed':
        return orders.filter(
          (o) => o.status === 'delivered' || o.status === 'cancelled'
        );
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  // Get count for each tab
  const getTabCount = (tab: TabType) => {
    if (!orders) return 0;
    switch (tab) {
      case 'pending':
        return orders.filter((o) => o.status === 'pending').length;
      case 'processing':
        return orders.filter(
          (o) => o.status === 'confirmed' || o.status === 'processing'
        ).length;
      case 'delivered':
        return orders.filter((o) => o.status === 'delivered').length;
      case 'completed':
        return orders.filter(
          (o) => o.status === 'delivered' || o.status === 'cancelled'
        ).length;
      default:
        return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
      case 'processing':
        return '#007AFF';
      case 'delivered':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'confirmed':
      case 'processing':
        return Package;
      case 'delivered':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Package;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderOrderCard = ({ item: order }: { item: VendorOrder }) => {
    const StatusIcon = getStatusIcon(order.status);
    const statusColor = getStatusColor(order.status);
    const itemCount = order.order_items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: colors.card }]}
        onPress={() =>
          router.push(`/(tabs)/(sell)/order-detail?orderId=${order.id}`)
        }
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <StatusIcon size={20} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatTimeAgo(order.created_at)}
          </Text>
        </View>

        {/* Order Info */}
        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <User size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {order.profiles.full_name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Package size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <DollarSign size={16} color={colors.textSecondary} />
            <Text style={[styles.totalText, { color: colors.text }]}>
              ₦{order.total.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Order Items Preview */}
        <View style={styles.itemsPreview}>
          {order.order_items.slice(0, 2).map((item, index) => (
            <Text
              key={item.id}
              style={[styles.itemPreviewText, { color: colors.textSecondary }]}
            >
              {item.quantity}x {item.products.name}
              {index < Math.min(order.order_items.length - 1, 1) && ', '}
            </Text>
          ))}
          {order.order_items.length > 2 && (
            <Text
              style={[styles.itemPreviewText, { color: colors.textSecondary }]}
            >
              +{order.order_items.length - 2} more
            </Text>
          )}
        </View>

        {/* Action Indicator */}
        {order.status === 'pending' && (
          <View
            style={[
              styles.actionBadge,
              { backgroundColor: '#FF9500' + '20', borderColor: '#FF9500' },
            ]}
          >
            <Text style={[styles.actionBadgeText, { color: '#FF9500' }]}>
              Needs Action
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Package size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No {activeTab} orders
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        {activeTab === 'pending'
          ? 'New orders will appear here'
          : activeTab === 'processing'
          ? 'Orders being packed will appear here'
          : activeTab === 'delivered'
          ? 'Delivered orders will appear here'
          : 'Completed orders will appear here'}
      </Text>
    </View>
  );

  if (!profile?.id) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <AppHeader title="My Orders" />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Please log in to view orders
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <AppHeader title="My Orders" />

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'pending' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <View style={styles.tabContent}>
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === 'pending' && {
                  color: colors.primary,
                  fontWeight: '600',
                },
              ]}
            >
              New
            </Text>
            {getTabCount('pending') > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{getTabCount('pending')}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'processing' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('processing')}
        >
          <View style={styles.tabContent}>
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === 'processing' && {
                  color: colors.primary,
                  fontWeight: '600',
                },
              ]}
            >
              Processing
            </Text>
            {getTabCount('processing') > 0 && (
              <View style={[styles.badge, { backgroundColor: '#007AFF' }]}>
                <Text style={styles.badgeText}>
                  {getTabCount('processing')}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'delivered' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('delivered')}
        >
          <View style={styles.tabContent}>
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === 'delivered' && {
                  color: colors.primary,
                  fontWeight: '600',
                },
              ]}
            >
              Delivered
            </Text>
            {getTabCount('delivered') > 0 && (
              <View style={[styles.badge, { backgroundColor: '#34C759' }]}>
                <Text style={styles.badgeText}>{getTabCount('delivered')}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'completed' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('completed')}
        >
          <View style={styles.tabContent}>
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === 'completed' && {
                  color: colors.primary,
                  fontWeight: '600',
                },
              ]}
            >
              Done
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Failed to load orders
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
  },
  orderInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  itemPreviewText: {
    fontSize: 13,
  },
  actionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
