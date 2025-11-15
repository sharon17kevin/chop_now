import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import {
  User,
  MapPin,
  ShoppingBag,
  Heart,
  Settings,
  Bell,
  CreditCard,
  CircleHelp as HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  AlertCircle,
  Package,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/useUserStore';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items_count: number;
  vendor_name?: string;
}

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
  const { profile, fetchProfile } = useUserStore();

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  async function fetchRecentOrders() {
    try {
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(
          'id, created_at, total_amount, status, items_count, vendor_name'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (fetchError) throw fetchError;

      setRecentOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchRecentOrders()]);
    setRefreshing(false);
  }

  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  function getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'completed')
      return '#059669';
    if (statusLower === 'cancelled') return '#EF4444';
    if (statusLower === 'processing' || statusLower === 'pending')
      return '#F59E0B';
    return '#6B7280';
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
                !key.includes('onboarding') && !key.includes('Onboarding')
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
            tintColor="#059669"
            colors={['#059669']}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                profile?.profile_image
                  ? { uri: profile.profile_image }
                  : {
                      uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
                    }
              }
              style={styles.avatar}
            />
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: 'profile' as any,
                })
              }
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>
            {profile?.full_name || profile?.email || 'Guest User'}
          </Text>
          <View style={styles.locationRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.userLocation}>
              {profile?.city && profile?.state
                ? `${profile.city}, ${profile.state}`
                : profile?.city || profile?.state || 'Location not set'}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.total_orders || 0}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile?.rating ? profile.rating.toFixed(1) : '0.0'}
              </Text>
              <View style={styles.ratingRow}>
                <Star size={12} color="#FCD34D" fill="#FCD34D" />
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile?.favorite_count || 0}
              </Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/(orders)' as any,
                })
              }
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchRecentOrders}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : recentOrders.length === 0 ? (
            <View style={styles.emptyOrdersContainer}>
              <View style={styles.emptyIconContainer}>
                <Package size={32} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyOrdersText}>No orders yet</Text>
              <Text style={styles.emptyOrdersSubtext}>
                Start shopping to see your orders here
              </Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/(orders)' as any,
                  })
                }
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.farmerName}>
                    {order.vendor_name || 'Vendor'}
                  </Text>
                  <Text style={styles.orderDetails}>
                    {order.items_count || 0} items • ₦
                    {order.total_amount.toFixed(2)}
                  </Text>
                  <Text style={styles.orderDate}>
                    {getTimeAgo(order.created_at)}
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
                  <ChevronRight size={16} color="#6B7280" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
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
                style={styles.menuItem}
              >
                <View style={styles.menuIconContainer}>
                  <IconComponent size={20} color="#059669" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRight size={16} color="#6B7280" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>FarmFresh v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
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
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userLocation: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
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
    color: '#059669',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
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
    color: '#1F2937',
  },
  seeAllText: {
    color: '#059669',
    fontWeight: '600',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginRight: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F0FDF4',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
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
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
  },
  retryText: {
    color: '#EF4444',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyOrdersText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
