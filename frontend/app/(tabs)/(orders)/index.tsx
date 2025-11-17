import OrderCard from '@/components/OrderCard';
import { typography } from '@/styles/typography';
import { useTheme } from '@/hooks/useTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Package } from 'lucide-react-native';
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
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
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
          My Orders
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            activeOpacity={0.7}
            style={[
              styles.tab,
              { backgroundColor: colors.filter },
              selectedTab === tab && [
                styles.activeTab,
                {
                  backgroundColor: colors.success,
                  shadowColor: colors.success,
                },
              ],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                selectedTab === tab && [
                  styles.activeTabText,
                  { color: colors.buttonText },
                ],
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ padding: 20 }}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.card, shadowColor: colors.text },
              ]}
            >
              <Package size={48} color={colors.textTetiary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No {selectedTab} orders yet
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Your {selectedTab} orders will appear here
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
