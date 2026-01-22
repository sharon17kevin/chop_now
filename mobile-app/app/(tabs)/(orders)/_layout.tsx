import { Stack } from 'expo-router';

export default function Layout() {
  return <Stack initialRouteName='index'>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="checkout" options={{ headerShown: false }} />
    <Stack.Screen name="breakdown" options={{ headerShown: false }} />
    <Stack.Screen name="trackorder" options={{ headerShown: false }} />
    <Stack.Screen name="review" options={{ headerShown: false }} />
  </Stack>
}