import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { typography } from '@/styles/typography';
import { useTheme } from '@/hooks/useTheme';
import { TouchableWithoutFeedback } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { Order } from '@/hooks/useOrders';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Wallet,
  CreditCard,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface OrderCardProps extends Partial<Order> {
  onDelete?: (id: string) => void;
  payment_status?: string;
  refund_status?: string;
  refund_amount?: number;
  refund_method?: string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  id,
  status,
  total,
  created_at,
  delivery_address,
  profiles,
  onDelete,
  payment_status,
  refund_status,
  refund_amount,
  refund_method,
}) => {
  const { colors } = useTheme();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [selectedReason, setSelectedReason] = React.useState('');
  const [refundMethod, setRefundMethod] = React.useState<'wallet' | 'paystack'>(
    'wallet'
  );
  const router = useRouter();

  const cancellationReasons = [
    'Changed my mind',
    'Found a better price',
    'Ordered by mistake',
    'Delivery takes too long',
    'Need to modify order',
    'Other',
  ];

  const handleCancelOrder = async () => {
    if (!selectedReason) {
      Alert.alert('Select Reason', 'Please select a reason for cancellation');
      return;
    }

    try {
      setCancelling(true);
      console.log('Cancelling order:', {
        id,
        reason: selectedReason,
        refundMethod,
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert('Error', 'Please login to cancel order');
        return;
      }

      const { data, error } = await supabase.functions.invoke('cancel-order', {
        body: {
          order_id: id,
          reason: selectedReason,
          refund_method: refundMethod,
        },
      });

      if (error) {
        console.error('Cancel order error:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('Order cancelled successfully:', data);

      // Show success message
      const refundMessage = data.refund_processed
        ? refundMethod === 'wallet'
          ? 'Refund has been credited to your wallet'
          : 'Refund will be processed in 3-5 business days'
        : '';

      Alert.alert(
        'Order Cancelled',
        `Your order has been cancelled. ${refundMessage}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setConfirmOpen(false);
              setSelectedReason('');
              if (onDelete) onDelete(id || '');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      Alert.alert(
        'Cancellation Failed',
        error.message || 'Failed to cancel order. Please try again.'
      );
    } finally {
      setCancelling(false);
    }
  };

  // Format the date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Map database status to display info
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          bgColor: colors.warning,
          textColor: colors.buttonText,
          icon: Clock,
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          bgColor: colors.info,
          textColor: colors.buttonText,
          icon: CheckCircle,
        };
      case 'processing':
        return {
          label: 'Processing',
          bgColor: colors.info,
          textColor: colors.buttonText,
          icon: Clock,
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

  return (
    <TouchableWithoutFeedback
      onPress={() =>
        router.push({
          pathname: '/(tabs)/(orders)/breakdown' as any,
          params: {
            orderId: id,
            status: status,
            total: total,
            createdAt: created_at,
            deliveryAddress: delivery_address,
            vendorName: profiles?.full_name,
          },
        })
      }
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {/* Header: Order ID and Status Badge */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.body1,
                { color: colors.text, fontWeight: '700', letterSpacing: 0.3 },
              ]}
            >
              Order {id?.slice(0, 8).toUpperCase()}
            </Text>
            <Text
              style={[
                typography.caption2,
                { color: colors.textTetiary, marginTop: 2 },
              ]}
            >
              {created_at && formatDate(created_at)}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: statusInfo.bgColor }]}>
            <statusInfo.icon size={14} color={statusInfo.textColor} />
            <Text
              style={[
                typography.caption1,
                {
                  color: statusInfo.textColor,
                  fontWeight: '700',
                  marginLeft: 4,
                },
              ]}
            >
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Refund Status - Show for cancelled/refunded orders */}
        {(status === 'cancelled' ||
          payment_status === 'refunded' ||
          payment_status === 'partially_refunded') &&
          refund_status && (
            <View style={styles.refundStatusContainer}>
              <View
                style={[
                  styles.refundBadge,
                  {
                    backgroundColor:
                      refund_status === 'completed'
                        ? colors.successBackground
                        : colors.warningBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption1,
                    {
                      color:
                        refund_status === 'completed'
                          ? colors.success
                          : colors.warning,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {refund_status === 'completed' && '✓ '}
                  {refund_status === 'completed'
                    ? 'Refunded'
                    : refund_status === 'processing'
                    ? 'Refund Processing'
                    : refund_status === 'pending'
                    ? 'Refund Pending'
                    : refund_status === 'failed'
                    ? 'Refund Failed'
                    : 'Refund Status Unknown'}
                </Text>
              </View>
              {refund_amount && refund_amount > 0 && (
                <Text
                  style={[
                    typography.body2,
                    { color: colors.text, fontWeight: '600', marginTop: 4 },
                  ]}
                >
                  ₦{refund_amount.toFixed(2)}{' '}
                  {refund_method === 'wallet'
                    ? 'to Wallet'
                    : refund_method === 'paystack'
                    ? 'to Bank'
                    : ''}
                </Text>
              )}
              {refund_status === 'processing' && (
                <Text
                  style={[
                    typography.caption2,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  Refund will be completed in 3-5 business days
                </Text>
              )}
            </View>
          )}

        {/* Vendor Info */}
        {profiles?.full_name && (
          <View style={styles.infoRow}>
            <Text
              style={[typography.caption2, { color: colors.textSecondary }]}
            >
              From
            </Text>
            <Text
              style={[
                typography.body2,
                { color: colors.text, fontWeight: '600', marginTop: 2 },
              ]}
            >
              {profiles.full_name}
            </Text>
          </View>
        )}

        {/* Delivery Address */}
        {delivery_address && (
          <View style={styles.infoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text
                style={[
                  typography.caption2,
                  { color: colors.textSecondary, marginLeft: 4 },
                ]}
              >
                Delivery
              </Text>
            </View>
            <Text
              style={[
                typography.body2,
                { color: colors.text, marginTop: 4, fontWeight: '500' },
              ]}
              numberOfLines={2}
            >
              {delivery_address}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Total Amount */}
        <View style={styles.footer}>
          <Text style={[typography.caption2, { color: colors.textSecondary }]}>
            Total Amount
          </Text>
          <Text
            style={[
              typography.h3,
              { color: colors.primary, fontWeight: '800', marginTop: 4 },
            ]}
          >
            ₦{total?.toFixed(2)}
          </Text>
        </View>

        {/* Action Button - For Pending, Confirmed, and Processing Orders */}
        {(status === 'pending' ||
          status === 'confirmed' ||
          status === 'processing') && (
          <TouchableOpacity
            onPress={() => setConfirmOpen(true)}
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.errorBackground,
                borderColor: colors.error,
                borderWidth: 1.5,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                typography.body2,
                { color: colors.error, fontWeight: '700' },
              ]}
            >
              Cancel Order
            </Text>
          </TouchableOpacity>
        )}

        {/* Cancellation Modal */}
        <Modal
          visible={confirmOpen}
          transparent
          animationType="slide"
          onRequestClose={() => !cancelling && setConfirmOpen(false)}
        >
          <View
            style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          >
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  maxHeight: '80%',
                },
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View
                  style={[
                    styles.modalIconContainer,
                    { backgroundColor: colors.errorBackground },
                  ]}
                >
                  <AlertCircle size={32} color={colors.error} />
                </View>

                <Text
                  style={[
                    typography.h3,
                    {
                      color: colors.text,
                      marginBottom: 8,
                      marginTop: 12,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Cancel Order?
                </Text>
                <Text
                  style={[
                    typography.body2,
                    {
                      color: colors.textSecondary,
                      marginBottom: 20,
                      lineHeight: 20,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Please select a reason for cancellation
                </Text>

                {/* Cancellation Reasons */}
                <View style={styles.reasonsContainer}>
                  <Text
                    style={[
                      typography.caption1,
                      { color: colors.textSecondary, marginBottom: 8 },
                    ]}
                  >
                    Reason *
                  </Text>
                  {cancellationReasons.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonOption,
                        {
                          backgroundColor:
                            selectedReason === reason
                              ? colors.primaryBackground
                              : colors.background,
                          borderColor:
                            selectedReason === reason
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedReason(reason)}
                      disabled={cancelling}
                    >
                      <View
                        style={[
                          styles.radioButton,
                          {
                            borderColor:
                              selectedReason === reason
                                ? colors.primary
                                : colors.border,
                            backgroundColor:
                              selectedReason === reason
                                ? colors.primary
                                : 'transparent',
                          },
                        ]}
                      >
                        {selectedReason === reason && (
                          <View
                            style={[
                              styles.radioButtonInner,
                              { backgroundColor: colors.buttonText },
                            ]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          typography.body2,
                          {
                            color:
                              selectedReason === reason
                                ? colors.primary
                                : colors.text,
                            fontWeight:
                              selectedReason === reason ? '600' : '400',
                          },
                        ]}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Refund Method */}
                <View style={styles.refundMethodContainer}>
                  <Text
                    style={[
                      typography.caption1,
                      { color: colors.textSecondary, marginBottom: 8 },
                    ]}
                  >
                    Refund Method
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.refundOption,
                      {
                        backgroundColor:
                          refundMethod === 'wallet'
                            ? colors.primaryBackground
                            : colors.background,
                        borderColor:
                          refundMethod === 'wallet'
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setRefundMethod('wallet')}
                    disabled={cancelling}
                  >
                    <Wallet
                      size={20}
                      color={
                        refundMethod === 'wallet'
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          typography.body2,
                          {
                            color:
                              refundMethod === 'wallet'
                                ? colors.primary
                                : colors.text,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        Wallet Credit (Instant)
                      </Text>
                      <Text
                        style={[
                          typography.caption2,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Get instant refund to your wallet
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.refundOption,
                      {
                        backgroundColor:
                          refundMethod === 'paystack'
                            ? colors.primaryBackground
                            : colors.background,
                        borderColor:
                          refundMethod === 'paystack'
                            ? colors.primary
                            : colors.border,
                        marginTop: 8,
                      },
                    ]}
                    onPress={() => setRefundMethod('paystack')}
                    disabled={cancelling}
                  >
                    <CreditCard
                      size={20}
                      color={
                        refundMethod === 'paystack'
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          typography.body2,
                          {
                            color:
                              refundMethod === 'paystack'
                                ? colors.primary
                                : colors.text,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        Bank Refund
                      </Text>
                      <Text
                        style={[
                          typography.caption2,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Refund to original payment method (3-5 days)
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: colors.filter },
                  ]}
                  onPress={() => {
                    setConfirmOpen(false);
                    setSelectedReason('');
                  }}
                  activeOpacity={0.7}
                  disabled={cancelling}
                >
                  <Text
                    style={[
                      typography.body2,
                      { color: colors.text, fontWeight: '700' },
                    ]}
                  >
                    Keep Order
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: colors.error,
                      opacity: cancelling || !selectedReason ? 0.5 : 1,
                    },
                  ]}
                  onPress={handleCancelOrder}
                  activeOpacity={0.7}
                  disabled={cancelling || !selectedReason}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color={colors.buttonText} />
                  ) : (
                    <Text
                      style={[
                        typography.body2,
                        { color: colors.buttonText, fontWeight: '700' },
                      ]}
                    >
                      Confirm Cancellation
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  infoRow: {
    marginBottom: 12,
  },
  footer: {
    marginVertical: 12,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '82%',
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  refundMethodContainer: {
    marginBottom: 20,
  },
  refundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  refundStatusContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  refundBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
});

export default OrderCard;
