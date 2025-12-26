import AppHeader from '@/components/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import {
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
  XCircle,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
  };
}

interface Order {
  id: string;
  user_id: string;
  vendor_id: string;
  status: string;
  total: number;
  delivery_address: string;
  delivery_notes?: string;
  created_at: string;
  order_items: OrderItem[];
  profiles: {
    full_name: string;
    phone: string;
  };
}

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch order details
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            id,
            product_id,
            quantity,
            price,
            products (
              name
            )
          ),
          profiles:user_id (
            full_name,
            phone
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data as Order;
    },
    enabled: !!orderId,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    },
  });

  const handleStatusUpdate = async (
    newStatus: string,
    confirmMessage: string
  ) => {
    Alert.alert('Confirm Action', confirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setIsUpdating(true);
          try {
            await updateStatusMutation.mutateAsync(newStatus);
            Alert.alert('Success', `Order ${newStatus} successfully`);
          } catch {
            Alert.alert('Error', 'Failed to update order status');
          } finally {
            setIsUpdating(false);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
        return '#007AFF';
      case 'processing':
        return '#5856D6';
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

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <AppHeader title="Order Details" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <AppHeader title="Order Details" />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Failed to load order details
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const StatusIcon = getStatusIcon(order.status);
  const statusColor = getStatusColor(order.status);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <AppHeader title="Order Details" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Order Status */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.statusHeader}>
            <StatusIcon size={24} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.orderIdText, { color: colors.textSecondary }]}>
            Order #{order.id.slice(0, 8)}
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {new Date(order.created_at).toLocaleString()}
          </Text>
        </View>

        {/* Customer Information */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Customer Information
          </Text>

          <View style={styles.infoRow}>
            <User size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {order.profiles.full_name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Phone size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {order.profiles.phone}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {order.delivery_address}
            </Text>
          </View>

          {order.delivery_notes && (
            <View
              style={[
                styles.instructionsBox,
                { backgroundColor: colors.background },
              ]}
            >
              <Text
                style={[
                  styles.instructionsLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Delivery Notes:
              </Text>
              <Text style={[styles.instructionsText, { color: colors.text }]}>
                {order.delivery_notes}
              </Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Order Items
          </Text>

          {order.order_items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                index < order.order_items.length - 1 && styles.itemBorder,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.products.name}
                </Text>
                <Text
                  style={[styles.itemQuantity, { color: colors.textSecondary }]}
                >
                  Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: colors.text }]}>
                ₦{(item.quantity * item.price).toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              ₦{order.total.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {order.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() =>
                  handleStatusUpdate('confirmed', 'Confirm this order?')
                }
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Confirm Order</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() =>
                  handleStatusUpdate('cancelled', 'Cancel this order?')
                }
                disabled={isUpdating}
              >
                <XCircle size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {order.status === 'confirmed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.preparingButton]}
              onPress={() =>
                handleStatusUpdate('processing', 'Start packing this order?')
              }
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Package size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Start Packing</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {order.status === 'processing' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.readyButton]}
              onPress={() =>
                handleStatusUpdate('delivered', 'Mark this order as delivered?')
              }
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Truck size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Mark Delivered</Text>
                </>
              )}
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  orderIdText: {
    fontSize: 14,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
  },
  instructionsBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  instructionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 13,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  preparingButton: {
    backgroundColor: '#007AFF',
  },
  readyButton: {
    backgroundColor: '#34C759',
  },
  completeButton: {
    backgroundColor: '#5856D6',
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
