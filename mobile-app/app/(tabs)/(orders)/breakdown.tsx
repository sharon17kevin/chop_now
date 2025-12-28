import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import AppHeader from '@/components/AppHeader';
import { useLocalSearchParams } from 'expo-router';
import { typography } from '@/styles/typography';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Package,
  Truck,
  Home,
  ShoppingBag,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function Breakdown() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  const orderId = params.orderId as string;
  const status = params.status as string;
  const total = parseFloat(params.total as string);
  const createdAt = params.createdAt as string;
  const deliveryAddress = params.deliveryAddress as string;
  const vendorName = params.vendorName as string;

  // Fetch order details with items
  const { data: orderDetails, isLoading } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            id,
            quantity,
            price,
            products (
              id,
              name,
              image_url,
              unit
            )
          ),
          profiles:vendor_id (
            full_name,
            farm_name
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status info
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Order Pending',
          bgColor: colors.warning,
          textColor: colors.buttonText,
          icon: Clock,
        };
      case 'confirmed':
        return {
          label: 'Order Confirmed',
          bgColor: colors.info,
          textColor: colors.buttonText,
          icon: CheckCircle,
        };
      case 'processing':
        return {
          label: 'Being Prepared',
          bgColor: colors.info,
          textColor: colors.buttonText,
          icon: Package,
        };
      case 'delivered':
        return {
          label: 'Delivered',
          bgColor: colors.success,
          textColor: colors.buttonText,
          icon: CheckCircle,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          bgColor: colors.error,
          textColor: colors.buttonText,
          icon: AlertCircle,
        };
      default:
        return {
          label: status,
          bgColor: colors.card,
          textColor: colors.text,
          icon: Clock,
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Progress tracking steps
  const getProgressSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: Clock },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'processing', label: 'Preparing', icon: Package },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: Home },
    ];

    const statusOrder = ['pending', 'confirmed', 'processing', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const progressSteps = getProgressSteps();

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader title="Order Details" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Order Header */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              typography.h3,
              { color: colors.text, fontWeight: '700', marginBottom: 8 },
            ]}
          >
            Order #{orderId?.slice(0, 8).toUpperCase()}
          </Text>
          <Text
            style={[
              typography.caption1,
              { color: colors.textSecondary, marginBottom: 16 },
            ]}
          >
            Placed on {formatDate(createdAt)}
          </Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.bgColor },
            ]}
          >
            <statusInfo.icon size={18} color={statusInfo.textColor} />
            <Text
              style={[
                typography.body2,
                {
                  color: statusInfo.textColor,
                  fontWeight: '700',
                  marginLeft: 8,
                },
              ]}
            >
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Progress Tracker */}
        {status !== 'cancelled' && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                typography.h3,
                { color: colors.text, fontWeight: '700', marginBottom: 20 },
              ]}
            >
              Order Progress
            </Text>

            <View style={styles.progressContainer}>
              {progressSteps.map((step, index) => (
                <View key={step.key} style={styles.progressStep}>
                  {/* Step Indicator */}
                  <View style={styles.stepIndicatorContainer}>
                    <View
                      style={[
                        styles.stepCircle,
                        {
                          backgroundColor: step.completed
                            ? colors.success
                            : colors.filter,
                          borderColor: step.active
                            ? colors.success
                            : colors.border,
                        },
                      ]}
                    >
                      <step.icon
                        size={20}
                        color={
                          step.completed
                            ? colors.buttonText
                            : colors.textTetiary
                        }
                      />
                    </View>

                    {/* Connector Line */}
                    {index < progressSteps.length - 1 && (
                      <View
                        style={[
                          styles.connectorLine,
                          {
                            backgroundColor: step.completed
                              ? colors.success
                              : colors.border,
                          },
                        ]}
                      />
                    )}
                  </View>

                  {/* Step Label */}
                  <View style={styles.stepLabel}>
                    <Text
                      style={[
                        typography.body2,
                        {
                          color: step.completed
                            ? colors.text
                            : colors.textSecondary,
                          fontWeight: step.active ? '700' : '600',
                        },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Order Items */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <ShoppingBag size={20} color={colors.text} />
            <Text
              style={[
                typography.body1,
                { color: colors.text, fontWeight: '700', marginLeft: 8 },
              ]}
            >
              Order Items
            </Text>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : orderDetails?.order_items &&
            orderDetails.order_items.length > 0 ? (
            <View>
              {orderDetails.order_items.map((item: any, index: number) => (
                <View key={item.id}>
                  <View style={styles.orderItem}>
                    {/* Product Image */}
                    {item.products?.image_url ? (
                      <Image
                        source={{ uri: item.products.image_url }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.itemImage,
                          {
                            backgroundColor: colors.filter,
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                        ]}
                      >
                        <Package size={24} color={colors.textTetiary} />
                      </View>
                    )}

                    {/* Product Details */}
                    <View style={styles.itemDetails}>
                      <Text
                        style={[
                          typography.body2,
                          {
                            color: colors.text,
                            fontWeight: '600',
                            marginBottom: 4,
                          },
                        ]}
                      >
                        {item.products?.name || 'Unknown Product'}
                      </Text>
                      <Text
                        style={[
                          typography.caption1,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Quantity: {item.quantity}{' '}
                        {item.products?.unit || 'unit'}
                        {item.quantity > 1 ? 's' : ''}
                      </Text>
                      <Text
                        style={[
                          typography.caption2,
                          { color: colors.textSecondary, marginTop: 2 },
                        ]}
                      >
                        ₦{item.price.toFixed(2)} each
                      </Text>
                    </View>

                    {/* Item Total */}
                    <View style={styles.itemPrice}>
                      <Text
                        style={[
                          typography.body2,
                          { color: colors.primary, fontWeight: '700' },
                        ]}
                      >
                        ₦{(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Divider between items */}
                  {index < orderDetails.order_items.length - 1 && (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border, marginVertical: 12 },
                      ]}
                    />
                  )}
                </View>
              ))}

              {/* Subtotal */}
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.border, marginVertical: 16 },
                ]}
              />
              <View style={styles.totalRow}>
                <Text
                  style={[
                    typography.body1,
                    { color: colors.textSecondary, fontWeight: '600' },
                  ]}
                >
                  Subtotal (
                  {orderDetails.order_items.reduce(
                    (sum: number, item: any) => sum + item.quantity,
                    0
                  )}{' '}
                  items)
                </Text>
                <Text
                  style={[
                    typography.h3,
                    { color: colors.text, fontWeight: '700' },
                  ]}
                >
                  ₦
                  {orderDetails.order_items
                    .reduce(
                      (sum: number, item: any) =>
                        sum + item.price * item.quantity,
                      0
                    )
                    .toFixed(2)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Package size={32} color={colors.textTetiary} />
              <Text
                style={[
                  typography.body2,
                  { color: colors.textSecondary, marginTop: 8 },
                ]}
              >
                No items found
              </Text>
            </View>
          )}
        </View>

        {/* Order Details */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              typography.body1,
              { color: colors.text, fontWeight: '700', marginBottom: 16 },
            ]}
          >
            Order Information
          </Text>

          {/* Vendor */}
          {vendorName && (
            <View style={styles.infoRow}>
              <Text style={[typography.body2, { color: colors.textSecondary }]}>
                Vendor
              </Text>
              <Text
                style={[
                  typography.body2,
                  { color: colors.text, fontWeight: '600' },
                ]}
              >
                {vendorName}
              </Text>
            </View>
          )}

          {/* Delivery Address */}
          {deliveryAddress && (
            <View style={styles.infoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin size={16} color={colors.textSecondary} />
                <Text
                  style={[
                    typography.body2,
                    { color: colors.textSecondary, marginLeft: 6 },
                  ]}
                >
                  Delivery Address
                </Text>
              </View>
              <Text
                style={[
                  typography.body2,
                  {
                    color: colors.text,
                    fontWeight: '500',
                    marginTop: 6,
                    lineHeight: 20,
                  },
                ]}
              >
                {deliveryAddress}
              </Text>
            </View>
          )}

          {/* Total */}
          <View
            style={[
              styles.divider,
              { backgroundColor: colors.border, marginVertical: 16 },
            ]}
          />
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <Text
              style={[
                typography.body1,
                { color: colors.textSecondary, fontWeight: '600' },
              ]}
            >
              Total Amount
            </Text>
            <Text
              style={[
                typography.h3,
                { color: colors.primary, fontWeight: '800' },
              ]}
            >
              ₦{total?.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  progressContainer: {
    paddingLeft: 8,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepIndicatorContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorLine: {
    width: 3,
    height: 32,
    marginTop: 4,
  },
  stepLabel: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 12,
  },
  infoRow: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
