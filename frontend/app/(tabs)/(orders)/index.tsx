import OrderCard from '@/components/OrderCard';
import { useTheme } from '@/hooks/useTheme';
import { useOrders } from '@/hooks/useOrders';
import { useRouter } from 'expo-router';
import { ArrowLeft, Package } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    activeOrders,
    ongoingOrders,
    completedOrders,
    loading,
    refreshing,
    error,
    handleRefresh,
  } = useOrders();

  const [selectedTab, setSelectedTab] = React.useState<string>('active');
  const tabs = ['active', 'ongoing', 'completed'];

  // Map selected tab to corresponding orders array
  const getFilteredOrders = () => {
    switch (selectedTab) {
      case 'active':
        return activeOrders;
      case 'ongoing':
        return ongoingOrders;
      case 'completed':
        return completedOrders;
      default:
        return activeOrders;
    }
  };

  const filteredOrders = getFilteredOrders();

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
        <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: 'white', flexDirection: 'row', flex: 1, gap: 1 }}>
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
              tintColor={colors.success}
            />
          }
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
            filteredOrders.map((order) => (
              <OrderCard key={order.id} {...order} />
            ))
          )}
        </ScrollView>
      )}
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
});
