import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '@/styles/typography';
import { useTheme } from '@/hooks/useTheme';

interface OrderCardProps {
  id: string;
  label?: string;
  date: string;
  total: number;
  items: number;
  status: 'active' | 'ongoing' | 'completed' | string;
  vendor?: string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  id,
  label,
  date,
  total,
  items,
  status,
  vendor,
}) => {
  const { colors } = useTheme();

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
          style={[typography.body1, { color: colors.text, fontWeight: '700' }]}
        >
          ${total.toFixed(2)}
        </Text>
      </View>
    </View>
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
});

export default OrderCard;
