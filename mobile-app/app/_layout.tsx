import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
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
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useAuth();
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
          '✅ OAuth callback detected, authentication will be handled automatically',
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

  // Navigation logic - only runs after auth is loaded
  useEffect(() => {
    if (isLoading) {
      // Don't navigate while loading
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';

    if (!hasCompletedOnboarding) {
      if (segments[0] && segments[0] !== 'index') {
        router.replace('/');
      }
      return;
    }

    if (!isAuthenticated && inAuthGroup) {
      // User is unauthenticated and somehow in a protected tab route
      router.replace('/login');
      return;
    }

    if (
      isAuthenticated &&
      !inAuthGroup &&
      segments[0] !== 'login' &&
      segments[0] !== 'signup' &&
      segments[0] !== 'signupstart' &&
      segments[0] !== 'otp' &&
      segments[0] !== 'forgot'
    ) {
      // User is authenticated but not inside the protected group
      router.replace('/(tabs)/(home)' as any);
      return;
    }
  }, [isAuthenticated, hasCompletedOnboarding, isLoading, segments]);

  // Hide splash screen once auth is loaded
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      console.log('✅ Splash screen hidden');
    }
  }, [isLoading]);

  // Show loading screen while auth is initializing
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
