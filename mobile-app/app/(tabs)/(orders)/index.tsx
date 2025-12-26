import OrderCard from '@/components/cards/OrderCard';
import { useTheme } from '@/hooks/useTheme';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { ArrowLeft, Package, ShoppingCart } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth(); // Get authenticated user
  const {
    activeCartGroups,
    ongoingOrders,
    completedOrders,
    loading,
    refreshing,
    error,
    handleRefresh,
  } = useOrders(); // Get orders and cart

  const [selectedTab, setSelectedTab] = React.useState<string>('active');
  const tabs = ['active', 'ongoing', 'completed'];

  // Show login prompt if not authenticated
  if (!user) {
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
          <View style={{ width: 40 }} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            My Orders
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconContainer,
              { backgroundColor: colors.card, shadowColor: colors.text },
            ]}
          >
            <ShoppingCart size={48} color={colors.textTetiary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Please log in
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            You need to be logged in to view your orders and cart
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get filtered data based on selected tab
  const getFilteredData = () => {
    switch (selectedTab) {
      case 'active':
        return { data: activeCartGroups, isCart: true };
      case 'ongoing':
        return { data: ongoingOrders, isCart: false };
      case 'completed':
        return { data: completedOrders, isCart: false };
      default:
        return { data: [], isCart: false };
    }
  };

  const { data: filteredData, isCart } = getFilteredData();

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
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {selectedTab === 'active' ? 'My Cart' : 'My Orders'}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        <View
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: 'white',
            flexDirection: 'row',
            flex: 1,
            gap: 1,
          }}
        >
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
                    backgroundColor: colors.secondary,
                    shadowColor: colors.secondary,
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
      </View>

      {error && (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: colors.errorBackground },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.success} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {filteredData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: colors.card, shadowColor: colors.text },
                ]}
              >
                {selectedTab === 'active' ? (
                  <ShoppingCart size={48} color={colors.textTetiary} />
                ) : (
                  <Package size={48} color={colors.textTetiary} />
                )}
              </View>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No {selectedTab} {selectedTab === 'active' ? 'items' : 'orders'}{' '}
                yet
              </Text>
              <Text
                style={[styles.emptySubtext, { color: colors.textSecondary }]}
              >
                {selectedTab === 'active'
                  ? 'Start shopping to add items to your cart'
                  : `Your ${selectedTab} orders will appear here`}
              </Text>
            </View>
          ) : isCart ? (
            // Render Cart Groups
            filteredData.map((group: any) => (
              <CartVendorGroup
                key={group.vendor_id}
                group={group}
                colors={colors}
              />
            ))
          ) : (
            // Render Orders
            filteredData.map((order: any) => (
              <OrderCard key={order.id} {...order} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Cart Vendor Group Component
function CartVendorGroup({ group, colors }: any) {
  const router = useRouter();
  return (
    <View
      style={[
        styles.vendorGroup,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
      ]}
    >
      {/* Vendor Header */}
      <View style={[styles.vendorHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.vendorName, { color: colors.text }]}>
          {group.vendor_name}
        </Text>
        <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
          {group.items.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0
          )}{' '}
          items
        </Text>
      </View>

      {/* Cart Items */}
      {group.items.slice(0, 2).map((item: any) => (
        <View
          key={item.id}
          style={[styles.cartItemRow, { borderBottomColor: colors.filter }]}
        >
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
          <View style={styles.itemDetails}>
            <Text style={[styles.itemName, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.itemPrice, { color: colors.primary }]}>
              ₦{(item.price * item.quantity).toLocaleString()} ({item.quantity}
              x)
            </Text>
          </View>
        </View>
      ))}
      {group.items.length > 2 && (
        <Text
          style={{
            color: colors.secondary,
            paddingLeft: 10,
            paddingVertical: 5,
            fontSize: 15,
          }}
        >
          And more ...
        </Text>
      )}

      {/* Total */}
      <View style={[styles.vendorTotal, { borderTopColor: colors.border }]}>
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
          Subtotal:
        </Text>
        <Text style={[styles.totalAmount, { color: colors.primary }]}>
          ₦{group.total.toLocaleString()}
        </Text>
      </View>

      {/* Checkout Button */}
      <TouchableOpacity
        style={[styles.checkoutButton, { backgroundColor: colors.secondary }]}
        onPress={() =>
          router.push({
            pathname: 'checkout' as any,
          })
        }
      >
        <Text style={styles.checkoutButtonText}>Checkout</Text>
      </TouchableOpacity>
    </View>
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
    // borderRadius: 12,
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
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  vendorGroup: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  cartItemRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  vendorTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  checkoutButton: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
