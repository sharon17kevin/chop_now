import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';

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

const recentOrders = [
  {
    id: 1,
    farmer: 'Green Valley Farm',
    items: 3,
    total: 24.47,
    date: '2 days ago',
    status: 'Delivered',
  },
  {
    id: 2,
    farmer: 'Berry Fields',
    items: 2,
    total: 18.99,
    date: '1 week ago',
    status: 'Delivered',
  },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
              }}
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
          <Text style={styles.userName}>Sarah Johnson</Text>
          <View style={styles.locationRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.userLocation}>San Francisco, CA</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.9</Text>
              <View style={styles.ratingRow}>
                <Star size={12} color="#FCD34D" fill="#FCD34D" />
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
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
          {recentOrders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard}>
              <View style={styles.orderInfo}>
                <Text style={styles.farmerName}>{order.farmer}</Text>
                <Text style={styles.orderDetails}>
                  {order.items} items • ${order.total.toFixed(2)}
                </Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={styles.orderStatus}>
                <Text style={styles.statusText}>{order.status}</Text>
                <ChevronRight size={16} color="#6B7280" />
              </View>
            </TouchableOpacity>
          ))}
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
          <TouchableOpacity style={styles.signOutButton}>
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
});
