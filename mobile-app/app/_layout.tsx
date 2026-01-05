import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryProvider } from '@/providers/QueryProvider';

import 'react-native-url-polyfill/auto';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// AsyncStorage.clear(); // For development purposes only

function RootLayoutNav() {
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();
  const { colors, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  // Initialize push notifications
  usePushNotifications();

  // Handle deep linking for OAuth callbacks
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('🔗 Deep link received:', url);

      // Parse the URL to check if it's an auth callback
      const parsed = Linking.parse(url);

      if (parsed.path === 'auth/callback') {
        console.log(
          '✅ OAuth callback detected, authentication will be handled automatically'
        );
        // The auth state change listener in useAuth will handle the session
      }
    };

    // Listen for deep link events
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(tabs)';

    if (!hasCompletedOnboarding) {
      if (segments.length > 0) {
        router.replace('/');
      }
      return;
    }

    if (!isAuthenticated && inAuthGroup) {
      // User is unauthenticated and somehow in a protected tab route
      router.replace('/login');
      return;
    }

    if (isAuthenticated && !inAuthGroup) {
      // User is authenticated but not inside the protected group
      router.replace('/(tabs)/(home)' as any);
      return;
    }
  }, [isAuthenticated, hasCompletedOnboarding, segments, router]);

  // Hide splash screen once the app is ready
  useEffect(() => {
    async function prepare() {
      try {
        // Wait max 5 seconds for initial setup
        await Promise.race([
          new Promise((resolve) => setTimeout(resolve, 5000)),
          // Wait for auth to initialize
          new Promise((resolve) => {
            const checkAuth = setInterval(() => {
              if (isAuthenticated !== null) {
                clearInterval(checkAuth)
                resolve(true)
              }
            }, 100)
          })
        ])
      } catch (e) {
        console.warn('Splash screen preparation error:', e)
      } finally {
        // Always hide splash screen
        await SplashScreen.hideAsync()
        console.log('✅ Splash screen hidden')
      }
    }

    prepare()
  }, [isAuthenticated])

  return (
    <BottomSheetModalProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="signupstart" options={{ headerShown: false }} />
          <Stack.Screen name="forgot" options={{ headerShown: false }} />
          <Stack.Screen name="otp" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="splash" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    </BottomSheetModalProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </QueryProvider>
          {/* <StatusBar style="auto" /> */}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
