import { useTheme } from '@/hooks/useTheme';
import { useRole } from '@/hooks/useRole';
import { Tabs } from 'expo-router';
import { Home, Plus, Search, ShoppingBag, User } from 'lucide-react-native';

export default function TabLayout() {
  const { colors } = useTheme();
  const { profile } = useRole();

  // Only show sell tab for verified vendors
  const isVerifiedVendor =
    profile?.role === 'vendor' && profile?.verified === true;

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
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: ({ size, color }) => <Plus size={size} color={color} />,
          href: isVerifiedVendor ? '/(tabs)/sell' : null,
        }}
      />
      <Tabs.Screen
        name="(orders)"
        options={{
          title: 'Orders',
          tabBarIcon: ({ size, color }) => (
            <ShoppingBag size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
