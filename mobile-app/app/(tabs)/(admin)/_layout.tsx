import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/stores/useUserStore';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';

export default function AdminLayout() {
  const { colors } = useTheme();
  const profile = useUserStore((state) => state.profile);
  const router = useRouter();

  // Check if user is admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      Alert.alert('Access Denied', 'Only admins can access this area.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/(home)') },
      ]);
    }
  }, [profile, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="vendorReview" options={{ title: 'Vendor Review' }} />
      <Stack.Screen name="analysis" options={{ title: 'Analysis' }} />
      <Stack.Screen name="productReview" options={{ title: 'Product Management' }} />
    </Stack>
  );
}
