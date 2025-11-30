import { Stack } from 'expo-router';

export default function Layout() {
  return <Stack initialRouteName='index'>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="notifications" options={{ headerShown: false }} />
    <Stack.Screen name="payment" options={{ headerShown: false }} />
    <Stack.Screen name="settings" options={{ headerShown: false }} />
    <Stack.Screen name="wishlist" options={{ headerShown: false }} />
    <Stack.Screen name="support" options={{ headerShown: false }} />
    <Stack.Screen name="profile" options={{ headerShown: false }} />
    <Stack.Screen name="vendorReg" options={{ headerShown: false }} />
  </Stack>
}