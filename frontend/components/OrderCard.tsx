import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { typography } from '@/styles/typography';
import { useTheme } from '@/hooks/useTheme';
import { TouchableWithoutFeedback } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';

interface OrderCardProps {
  id: string;
  label?: string;
  date: string;
  total: number;
  items: number;
  status: 'active' | 'ongoing' | 'completed' | string;
  vendor?: string;
  onDelete?: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  id,
  label,
  date,
  total,
  items,
  status,
  vendor,
  onDelete,
}) => {
  const { colors } = useTheme();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const router = useRouter();

  const badgeStyle = () => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#F59E0B', color: '#fff' };
      case 'ongoing':
        return { backgroundColor: '#3B82F6', color: '#fff' };
      case 'completed':
        return { backgroundColor: '#10B981', color: '#fff' };
      default:
        return { backgroundColor: colors.card, color: colors.text };
    }
  };

  const badge = badgeStyle();

  return (
    <TouchableWithoutFeedback
      onPress={() =>
        router.push({
          pathname: 'checkout' as any,
        })
      }
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.body1,
                { color: colors.text, fontWeight: '700' },
              ]}
            >
              {label || id}
            </Text>
            {vendor ? (
              <Text style={[typography.body2, { color: colors.textSecondary }]}>
                {vendor} • {date}
              </Text>
            ) : (
              <Text style={[typography.body2, { color: colors.textSecondary }]}>
                {date}
              </Text>
            )}
          </View>

          <View
            style={[styles.badge, { backgroundColor: badge.backgroundColor }]}
          >
            <Text
              style={[
                typography.caption1,
                { color: badge.color, fontWeight: '700' },
              ]}
            >
              {status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.rowBottom}>
          <Text style={[typography.body2, { color: colors.text }]}>
            {items} item{items > 1 ? 's' : ''}
          </Text>
          <Text
            style={[
              typography.body1,
              { color: colors.text, fontWeight: '700' },
            ]}
          >
            ${total.toFixed(2)}
          </Text>
        </View>

        {status === 'active' ? (
          <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
            <TouchableOpacity
              onPress={() => setConfirmOpen(true)}
              style={styles.deleteButton}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Modal
          visible={confirmOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmOpen(false)}
        >
          <View
            style={[
              styles.modalBackdrop,
              { backgroundColor: 'rgba(0,0,0,0.4)' },
            ]}
          >
            <View
              style={[styles.modalContainer, { backgroundColor: colors.card }]}
            >
              <Text
                style={[typography.h3, { color: colors.text, marginBottom: 8 }]}
              >
                Delete order?
              </Text>
              <Text
                style={[
                  typography.body2,
                  { color: colors.textSecondary, marginBottom: 16 },
                ]}
              >
                This action cannot be undone. Are you sure you want to delete{' '}
                {label || id}?
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton]}
                  onPress={() => setConfirmOpen(false)}
                >
                  <Text style={[styles.modalButtonText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalDanger]}
                  onPress={() => {
                    setConfirmOpen(false);
                    if (onDelete) onDelete(id);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                    Delete
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
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '86%',
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#374151',
    fontWeight: '700',
  },
  modalDanger: {
    backgroundColor: '#EF4444',
  },
});

export default OrderCard;
