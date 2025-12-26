import { Stack } from 'expo-router';

export default function Layout() {
  return <Stack initialRouteName='index'>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="orders" options={{ headerShown: false }} />
    <Stack.Screen name="order-detail" options={{ headerShown: false }} />
  </Stack>
}