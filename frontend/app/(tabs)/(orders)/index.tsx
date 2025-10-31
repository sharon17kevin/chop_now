import OrderCard from '@/components/OrderCard';
import { typography } from '@/styles/typography';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const cartItems = [
  {
    id: 1,
    name: 'Organic Tomatoes',
    price: 4.99,
    quantity: 2,
    unit: 'per lb',
    farmer: 'Green Valley Farm',
    image:
      'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    name: 'Fresh Strawberries',
    price: 6.99,
    quantity: 1,
    unit: 'per basket',
    farmer: 'Berry Fields',
    image:
      'https://images.pexels.com/photos/46174/strawberries-berries-fruit-freshness-46174.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 3,
    name: 'Farm Fresh Eggs',
    price: 5.49,
    quantity: 3,
    unit: 'per dozen',
    farmer: 'Sunny Side Farm',
    image:
      'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

const mockOrders = [
  {
    id: 'ORD-1001',
    label: 'Order #1001',
    date: '2025-10-28',
    total: 24.5,
    items: 3,
    status: 'active',
    vendor: 'Green Valley Farm',
  },
  {
    id: 'ORD-1002',
    label: 'Order #1002',
    date: '2025-10-20',
    total: 12.99,
    items: 1,
    status: 'ongoing',
    vendor: 'Berry Fields',
  },
  {
    id: 'ORD-1003',
    label: 'Order #1003',
    date: '2025-09-30',
    total: 18.0,
    items: 2,
    status: 'completed',
    vendor: 'Sunny Side Farm',
  },
  {
    id: 'ORD-1004',
    label: 'Order #1004',
    date: '2025-10-05',
    total: 9.5,
    items: 1,
    status: 'ongoing',
    vendor: 'Local Deli',
  },
  {
    id: 'ORD-1005',
    label: 'Order #1005',
    date: '2025-09-15',
    total: 42.75,
    items: 5,
    status: 'completed',
    vendor: 'Bistro Corner',
  },
];

export default function CartScreen() {
  const { colors } = useTheme();
  const { restaurant } = useLocalSearchParams();
  const router = useRouter();
  const restaurantName = restaurant
    ? restaurant
        .toString()
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Restaurant';
  const [selectedTab, setSelectedTab] = React.useState<string>('active');
  const tabs = ['active', 'ongoing', 'completed'];
  const filteredOrders = mockOrders.filter((o) => o.status === selectedTab);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={[styles.tabsContainer, { flexDirection: 'row' }]}>
        {tabs.map((tab, idx) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            activeOpacity={0.7}
            style={[
              styles.tabFlex,
              {
                backgroundColor:
                  selectedTab === tab ? colors.primary : colors.background,
                borderColor: colors.primary,
                borderLeftWidth: idx === 0 ? 1 : 0,
                borderRightWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                typography.body2,
                {
                  color: selectedTab === tab ? '#fff' : colors.text,
                  fontWeight: selectedTab === tab ? 'bold' : 'normal',
                  textAlign: 'center',
                },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ padding: 20 }}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.placeholderBox}>
            <Text style={[typography.body1, { color: colors.text }]}>
              No {selectedTab} orders yet.
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => <OrderCard key={order.id} {...order} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  placeholderBox: {
    marginTop: 40,
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  tabFlex: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
});