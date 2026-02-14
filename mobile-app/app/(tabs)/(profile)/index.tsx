import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useRole } from '@/hooks/useRole';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import { useVirtualAccountStore } from '@/stores/useVirtualAccountStore';
import { formatTimeAgo } from '@/utils/time';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import {
  AlertCircle,
  Bell,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Heart,
  CircleHelp as HelpCircle,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  Star,
  User,
  Wallet,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
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
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const menuItems = [
  {
    id: 1,
    title: 'My Orders',
    icon: ShoppingBag,
    link: '/(tabs)/(orders)',
    subtitle: 'Track your purchases',
  },
  {
    id: 2,
    title: 'Favorites',
    icon: Heart,
    link: 'wishlist',
    subtitle: 'Your favorite products',
  },
  {
    id: 3,
    title: 'Delivery Address',
    icon: MapPin,
    link: '/(tabs)/(home)/delivery',
    subtitle: 'Manage your addresses',
  },
  {
    id: 4,
    title: 'Wallet',
    icon: Wallet,
    link: 'wallet',
    subtitle: 'View balance and transactions',
  },
  {
    id: 'payment',
    title: 'Payment Methods',
    icon: CreditCard,
    link: 'payment',
    subtitle: 'Cards and payment options',
  },
  {
    id: 5,
    title: 'Notifications',
    icon: Bell,
    link: 'notifications',
    subtitle: 'Manage your notifications',
  },
  {
    id: 6,
    title: 'Settings',
    icon: Settings,
    link: 'settings',
    subtitle: 'App preferences',
  },
  {
    id: 7,
    title: 'Help & Support',
    icon: HelpCircle,
    link: 'support',
    subtitle: 'Get help when you need it',
  },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();
  const {
    profile,
    fetchProfile,
    vendorApplication,
    fetchVendorApplication,
    hasPendingApplication,
    isApplicationRejected,
  } = useUserStore();
  const { account: virtualAccount, fetchAccount } = useVirtualAccountStore();
  const { isVendor } = useRole();

  const [refreshing, setRefreshing] = useState(false);

  // Use the shared orders hook and get last 2 orders
  const {
    ongoingOrders,
    completedOrders,
    loading,
    handleRefresh: refetchOrders,
  } = useOrders();

  // Fetch virtual account when profile loads
  useEffect(() => {
    if (profile?.id) {
      fetchAccount(profile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Combine and sort to get last 2 orders
  const recentOrders = [...ongoingOrders, ...completedOrders]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 2);

  async function handleRefresh() {
    try {
      setRefreshing(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await Promise.all([
          fetchProfile(user.id),
          fetchVendorApplication(user.id),
          fetchAccount(user.id),
          refetchOrders(),
        ]);
      } else {
        await refetchOrders();
      }
    } catch (err) {
      console.error('Error during refresh:', err);
    } finally {
      setRefreshing(false);
    }
  }

  async function copyAccountNumber() {
    if (virtualAccount?.account_number) {
      await Clipboard.setStringAsync(virtualAccount.account_number);
      Alert.alert('Copied!', 'Account number copied to clipboard');
    }
  }

  function getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'completed')
      return colors.success;
    if (statusLower === 'cancelled') return colors.error;
    if (statusLower === 'processing' || statusLower === 'pending')
      return colors.warning;
    return colors.textSecondary;
  }

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🔥 Starting logout process...');

            // Sign out from Supabase first
            await logout();

            // Clear session from SecureStore
            await SecureStore.deleteItemAsync('supabaseSession');

            // Clear only auth-related AsyncStorage (preserve onboarding state)
            const keys = await AsyncStorage.getAllKeys();
            const authKeys = keys.filter(
              (key) =>
                !key.includes('onboarding') && !key.includes('Onboarding'),
            );
            if (authKeys.length > 0) {
              await AsyncStorage.multiRemove(authKeys);
            }

            console.log('✅ Logout complete');
          } catch (error) {
            console.error('❌ Error during logout:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.filter },
              ]}
            >
              <User size={40} color={colors.textSecondary} opacity={0.3} />
            </View>
            <Image
              source={{
                uri:
                  profile?.profile_image ||
                  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
              }}
              style={styles.avatar}
              cachePolicy="memory-disk"
              transition={200}
              priority="high"
              contentFit="cover"
              placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
            />
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: 'profile' as any,
                })
              }
              style={[styles.editButton, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.editButtonText, { color: colors.buttonText }]}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {profile?.full_name || profile?.email || 'Guest User'}
          </Text>

          {/* Virtual Account Row - Replaces Location */}
          {virtualAccount ? (
            <TouchableOpacity
              style={styles.accountRow}
              onPress={() =>
                router.push('/(tabs)/(profile)/virtualAccount' as any)
              }
              activeOpacity={0.7}
            >
              <Wallet size={16} color={colors.success} />
              <Text style={[styles.accountNumber, { color: colors.success }]}>
                {virtualAccount.bank_name} • {virtualAccount.account_number}
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  copyAccountNumber();
                }}
                style={styles.copyIcon}
              >
                <Copy size={14} color={colors.success} />
              </TouchableOpacity>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.accountRow}
              onPress={() =>
                router.push('/(tabs)/(profile)/virtualAccount' as any)
              }
              activeOpacity={0.7}
            >
              <Wallet size={16} color={colors.textSecondary} />
              <Text
                style={[
                  styles.createAccountText,
                  { color: colors.textSecondary },
                ]}
              >
                Tap to create virtual account
              </Text>
              <ChevronRight size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {profile?.total_orders || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Orders
              </Text>
            </View>
            {isVendor && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {profile?.rating ? profile.rating.toFixed(1) : '0.0'}
                </Text>
                <View style={styles.ratingRow}>
                  <Star size={12} color="#FCD34D" fill="#FCD34D" />
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Rating
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {profile?.favorite_count || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Favorites
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Verification Banner - Show for all unverified users */}
        {profile &&
          !profile.verified &&
          (() => {
            const isPending = hasPendingApplication();
            const isRejected = isApplicationRejected();

            return (
              <TouchableOpacity
                style={[
                  styles.vendorBanner,
                  {
                    backgroundColor: isPending
                      ? colors.primary + '15'
                      : isRejected
                        ? colors.error + '15'
                        : colors.warning + '15',
                    borderColor: isPending
                      ? colors.primary + '40'
                      : isRejected
                        ? colors.error + '40'
                        : colors.warning + '40',
                  },
                ]}
                onPress={() =>
                  router.push('/(tabs)/(profile)/vendorReg' as any)
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.vendorIconContainer,
                    {
                      backgroundColor: isPending
                        ? colors.primary
                        : isRejected
                          ? colors.error
                          : colors.warning,
                    },
                  ]}
                >
                  {isPending ? (
                    <Clock size={24} color="#FFF" />
                  ) : (
                    <AlertCircle size={24} color="#FFF" />
                  )}
                </View>
                <View style={styles.vendorTextContainer}>
                  <Text style={[styles.vendorTitle, { color: colors.text }]}>
                    {isPending
                      ? 'Application Under Review'
                      : isRejected
                        ? 'Application Rejected'
                        : isVendor
                          ? 'Vendor Verification Pending'
                          : 'Become a Vendor'}
                  </Text>
                  <Text
                    style={[
                      styles.vendorSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {isPending
                      ? "We're reviewing your vendor application. This usually takes 2-3 business days."
                      : isRejected
                        ? vendorApplication?.rejection_reason ||
                          'Your application was not approved. Tap to reapply.'
                        : isVendor
                          ? 'Your vendor account is under review (2-3 business days)'
                          : 'Complete verification to unlock vendor features and start selling'}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })()}

        {/* Recent Orders */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Orders
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/(orders)' as any,
                })
              }
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading orders...
              </Text>
            </View>
          ) : recentOrders.length === 0 ? (
            <View style={styles.emptyOrdersContainer}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: colors.filter },
                ]}
              >
                <Package size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyOrdersText, { color: colors.text }]}>
                No orders yet
              </Text>
              <Text
                style={[
                  styles.emptyOrdersSubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Start shopping to see your orders here
              </Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, { borderBottomColor: colors.border }]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/(orders)' as any,
                  })
                }
              >
                <View style={styles.orderInfo}>
                  <Text style={[styles.farmerName, { color: colors.text }]}>
                    {order.profiles?.full_name || 'Vendor'}
                  </Text>
                  <Text
                    style={[
                      styles.orderDetails,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ₦{order.total?.toLocaleString() || '0'}
                  </Text>
                  <Text
                    style={[styles.orderDate, { color: colors.textTetiary }]}
                  >
                    {formatTimeAgo(order.created_at)}
                  </Text>
                </View>
                <View style={styles.orderStatus}>
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(order.status) },
                    ]}
                  >
                    {order.status}
                  </Text>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Menu Items */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: `${item.link}` as any,
                  })
                }
                key={item.id}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: colors.filter },
                  ]}
                >
                  <IconComponent size={20} color={colors.primary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[
              styles.signOutButton,
              { backgroundColor: colors.destructiveBackground },
            ]}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.signOutText, { color: colors.error }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            FarmFresh v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userLocation: {
    fontSize: 16,
    marginLeft: 4,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  accountNumber: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '600',
  },
  copyIcon: {
    padding: 4,
    marginLeft: 6,
  },
  createAccountText: {
    fontSize: 13,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    marginLeft: 2,
  },
  vendorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  vendorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vendorTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  vendorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  vendorSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontWeight: '600',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  orderInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  retryText: {
    fontWeight: '700',
    fontSize: 13,
  },
  emptyOrdersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyOrdersText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
