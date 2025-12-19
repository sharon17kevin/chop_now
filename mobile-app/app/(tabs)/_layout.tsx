import { useRole } from '@/hooks/useRole';
import { useTheme } from '@/hooks/useTheme';
import { Tabs } from 'expo-router';
import {
  Bus,
  Home,
  Plus,
  Search,
  Shield,
  ShoppingBag,
  User,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { colors } = useTheme();
  const { profile } = useRole();
  const insets = useSafeAreaInsets();

  // Only show sell tab for verified vendors
  const isVerifiedVendor =
    profile?.role === 'vendor' && profile?.verified === true;

  // Only show admin tab for admins
  const isAdmin = profile?.role === 'admin';

  // Calculate tab bar height based on safe area insets
  // iOS: Use original design (80px height, 20px bottom padding)
  // Android: Adjust based on device's bottom inset to avoid overlap
  const tabBarHeight = Platform.OS === 'ios' ? 80 : 60 + insets.bottom;
  const tabBarPaddingBottom =
    Platform.OS === 'ios' ? 20 : Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.success,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 10,
        },
      }}
      initialRouteName="(home)"
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          href: '/(tabs)/(home)',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
          href: '/(tabs)/search',
        }}
      />
      <Tabs.Screen
        name="(sell)"
        options={{
          title: 'Sell',
          tabBarIcon: ({ size, color }) => <Plus size={size} color={color} />,
          href: isVerifiedVendor ? '/(tabs)/(sell)' : null,
        }}
      />
      <Tabs.Screen
        name="(orders)"
        options={{
          title: 'Orders',
          tabBarIcon: ({ size, color }) => (
            <ShoppingBag size={size} color={color} />
          ),
          href: '/(tabs)/(orders)',
        }}
      />
      <Tabs.Screen
        name="(admin)"
        options={{
          title: 'Admin',
          tabBarIcon: ({ size, color }) => <Shield size={size} color={color} />,
          href: isAdmin ? '/(tabs)/(admin)' : null,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          href: '/(tabs)/(profile)',
        }}
      />
    </Tabs>
  );
}
