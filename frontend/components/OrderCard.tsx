import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { typography } from '@/styles/typography';
import { useTheme } from '@/hooks/useTheme';
import { TouchableWithoutFeedback } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { Order } from '@/hooks/useOrders';
import { Clock, CheckCircle, AlertCircle, MapPin } from 'lucide-react-native';

interface OrderCardProps extends Partial<Order> {
  onDelete?: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  id,
  status,
  total,
  created_at,
  delivery_address,
  profiles,
  onDelete,
}) => {
  const { colors } = useTheme();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const router = useRouter();

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

        {/* Action Button - Only for Pending Orders */}
        {status === 'pending' && (
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

        {/* Confirmation Modal */}
        <Modal
          visible={confirmOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmOpen(false)}
        >
          <View
            style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          >
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
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
                  { color: colors.text, marginBottom: 8, marginTop: 12 },
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
                  },
                ]}
              >
                This action cannot be undone. Your order will be cancelled.
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: colors.filter },
                  ]}
                  onPress={() => setConfirmOpen(false)}
                  activeOpacity={0.7}
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
                    { backgroundColor: colors.error },
                  ]}
                  onPress={() => {
                    setConfirmOpen(false);
                    if (onDelete) onDelete(id || '');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      typography.body2,
                      { color: colors.buttonText, fontWeight: '700' },
                    ]}
                  >
                    Cancel Order
                  </Text>
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
});

export default OrderCard;
