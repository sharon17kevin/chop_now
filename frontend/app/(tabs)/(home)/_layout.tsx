import { Stack } from 'expo-router';

export default function Layout() {
  return <Stack initialRouteName='index'>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="delivery" options={{ headerShown: false }} />
    <Stack.Screen name="newaddress" options={{ headerShown: false }} />
  </Stack>
}
