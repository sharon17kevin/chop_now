import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { useUserStore } from '../stores/useUserStore';
import * as authService from '../services/auth/auth';

// ✅ Using expo-secure-store for sensitive session tokens
// AsyncStorage still used for non-sensitive data like onboarding state

interface AuthContextType {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  user: any | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'vendor'
  ) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (token: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (
    email: string,
    code: string,
    name: string,
    password: string,
    role: 'customer' | 'vendor'
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Restore session and onboarding state
  useEffect(() => {
    let mounted = true;
    let isInitializing = true;

    const initAuth = async () => {
      try {
        console.log('🔄 Initializing auth state...');

        // ✅ Use Supabase as the source of truth for session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error getting session:', error);
          throw error;
        }

        const session = data?.session ?? null;

        if (mounted) {
          if (session) {
            console.log('✅ Session found, user:', session.user.email);

            // ✅ Verify user still exists in auth.users
            const { data: userData, error: userError } =
              await supabase.auth.admin.getUserById(session.user.id);

            if (userError || !userData.user) {
              console.error('❌ User no longer exists, clearing session');
              await SecureStore.deleteItemAsync('supabaseSession');
              await supabase.auth.signOut();
              setUser(null);
              setIsAuthenticated(false);
              useUserStore.getState().clearProfile();
            } else {
              setUser(session.user);
              setIsAuthenticated(true);

              // ✅ Persist session securely for backup
              await SecureStore.setItemAsync(
                'supabaseSession',
                JSON.stringify(session)
              );

              // ✅ Fetch user profile and role
              console.log('📊 Fetching user profile...');
              try {
                await useUserStore.getState().fetchProfile(session.user.id);
                console.log('✅ Profile fetched');
              } catch (error) {
                console.error(
                  '⚠️ Profile fetch failed - user might not have profile, clearing session'
                );
                // If profile doesn't exist, clear session
                await SecureStore.deleteItemAsync('supabaseSession');
                await supabase.auth.signOut();
                setUser(null);
                setIsAuthenticated(false);
                useUserStore.getState().clearProfile();
              }
            }
          } else {
            console.log('❌ No session found in Supabase');

            // Try to restore from SecureStore as fallback
            try {
              const storedSession = await SecureStore.getItemAsync(
                'supabaseSession'
              );
              if (storedSession) {
                console.log(
                  '🔄 Found stored session, attempting to restore...'
                );
                const parsedSession = JSON.parse(storedSession);

                // Set the session in Supabase
                const { data: sessionData, error: setError } =
                  await supabase.auth.setSession({
                    access_token: parsedSession.access_token,
                    refresh_token: parsedSession.refresh_token,
                  });

                if (setError) {
                  console.error('❌ Failed to restore session:', setError);
                  throw setError;
                }

                if (sessionData.session) {
                  console.log('✅ Session restored successfully');

                  // Verify profile exists before marking as authenticated
                  try {
                    await useUserStore
                      .getState()
                      .fetchProfile(sessionData.session.user.id);
                    console.log('✅ Profile fetched after restore');

                    // Only set authenticated if profile exists
                    setUser(sessionData.session.user);
                    setIsAuthenticated(true);
                  } catch (error) {
                    console.error(
                      '❌ Profile fetch failed after restore - clearing session:',
                      error
                    );
                    // Profile doesn't exist, clear everything
                    await SecureStore.deleteItemAsync('supabaseSession');
                    await supabase.auth.signOut();
                    setUser(null);
                    setIsAuthenticated(false);
                    useUserStore.getState().clearProfile();
                  }
                } else {
                  console.log('ℹ️ No valid session in stored data');
                  setUser(null);
                  setIsAuthenticated(false);
                  useUserStore.getState().clearProfile();
                }
              } else {
                console.log('ℹ️ No stored session found in SecureStore');
                setUser(null);
                setIsAuthenticated(false);
                useUserStore.getState().clearProfile();
              }
            } catch (restoreError) {
              console.error('❌ Error restoring session:', restoreError);
              setUser(null);
              setIsAuthenticated(false);
              await SecureStore.deleteItemAsync('supabaseSession');
              useUserStore.getState().clearProfile();
            }
          }

          // Restore onboarding state (non-sensitive, can use AsyncStorage)
          const onboardingCompleted = await AsyncStorage.getItem(
            'onboardingCompleted'
          );
          setHasCompletedOnboarding(onboardingCompleted === 'true');
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
          setHasCompletedOnboarding(false);
          useUserStore.getState().clearProfile();
        }
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization complete');
          isInitializing = false;
          setIsLoading(false);
        }
      }
    };

    // ✅ Sync with Supabase auth state changes (login/logout/token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state change:', event);

        // ⚠️ Skip INITIAL_SESSION event during initialization
        // This prevents race condition where listener clears data before initAuth completes
        if (event === 'INITIAL_SESSION' && isInitializing) {
          console.log('⏭️ Skipping INITIAL_SESSION during initialization');
          return;
        }

        const currentUser = session?.user ?? null;

        // Only update state if it's not the initial load or if session exists
        if (!isInitializing || currentUser) {
          setUser(currentUser);
          setIsAuthenticated(!!currentUser);

          // ✅ Persist session securely on any auth change
          if (currentUser && session) {
            console.log('💾 Persisting session for:', currentUser.email);
            await SecureStore.setItemAsync(
              'supabaseSession',
              JSON.stringify(session)
            );

            // ✅ Fetch/refresh profile when session changes
            if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              // ✅ Only refresh profile for token refresh or user updates
              // Skip for SIGNED_IN (handled by signup/login flows)
              console.log('📊 Refreshing profile...');
              try {
                await useUserStore.getState().fetchProfile(currentUser.id);
                console.log('✅ Profile refresh complete');
              } catch (error) {
                console.error('⚠️ Profile refresh failed:', error);
              }
            }
          } else if (event !== 'INITIAL_SESSION') {
            // Only clear on actual logout, not initial session
            console.log('🗑️ Clearing session data');
            await SecureStore.deleteItemAsync('supabaseSession');
            useUserStore.getState().clearProfile();
          }
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ✅ Sign-in using auth service
  const login = async (email: string, password: string) => {
    const result = await authService.signIn(email, password);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      await SecureStore.setItemAsync(
        'supabaseSession',
        JSON.stringify(result.data)
      );

      // ✅ Fetch user profile and role
      await useUserStore.getState().fetchProfile(result.data.user.id);

      // ✅ Navigation handled by _layout.tsx
    }

    return { success: true };
  };

  // ✅ Sign-up using auth service
  const signup = async (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'vendor'
  ) => {
    console.log('🔐 useAuth.signup called', { name, email, role });

    const result = await authService.signUp(email, password, name, role);

    console.log('📊 Signup result:', {
      success: result.success,
      hasData: !!result.data,
      hasUser: !!result.data?.user,
      error: result.error,
    });

    if (!result.success) {
      console.error('❌ Signup failed:', result.error);
      return { success: false, error: result.error };
    }

    if (result.data?.user) {
      console.log('👤 Setting user in state:', result.data.user.id);
      // Store user temporarily but don't mark as authenticated until email verified
      setUser(result.data.user);

      // Only store session if it exists (may be null if email confirmation required)
      if (result.data.session) {
        console.log('💾 Storing session in SecureStore');
        await SecureStore.setItemAsync(
          'supabaseSession',
          JSON.stringify(result.data.session)
        );
      } else {
        console.log('⚠️ No session returned (email confirmation required)');
      }

      console.log('🚀 Navigating to OTP page');
      // Navigate to OTP verification page
      router.push('/otp' as any);
    } else {
      console.error('❌ No user data in result');
      return { success: false, error: 'Failed to create account' };
    }

    return { success: true };
  };

  // ✅ Verify OTP for email confirmation
  const verifyOtp = async (token: string) => {
    if (!user?.email) {
      return { success: false, error: 'No user email found' };
    }

    const result = await authService.verifyOtp(user.email, token);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Mark as authenticated and fetch profile after verification
    setIsAuthenticated(true);
    if (user?.id) {
      await useUserStore.getState().fetchProfile(user.id);
    }

    // ✅ Navigation handled by _layout.tsx
    return { success: true };
  };

  // ✅ Resend OTP
  const resendOtp = async () => {
    if (!user?.email) {
      return { success: false, error: 'No user email found' };
    }

    const result = await authService.resendOtp(user.email);
    return result;
  };

  // ✅ NEW: Verify Email OTP (custom flow)
  const verifyEmailOtp = async (
    email: string,
    code: string,
    name: string,
    password: string,
    role: 'customer' | 'vendor'
  ) => {
    console.log('🔐 useAuth.verifyEmailOtp - Starting verification...');

    // Call Edge Function to verify and create user
    const result = await authService.verifyEmailOtp(
      email,
      code,
      name,
      password,
      role
    );

    if (!result.success) {
      console.error('❌ Email OTP verification failed:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ User created:', result.data?.user?.id);

    // Check if Edge Function returned a session
    if (result.data?.session) {
      console.log('✅ Session returned from Edge Function, using it directly');

      // Set the session in Supabase client
      const { data: sessionData, error: setError } =
        await supabase.auth.setSession({
          access_token: result.data.session.access_token,
          refresh_token: result.data.session.refresh_token,
        });

      if (setError) {
        console.error('❌ Failed to set session:', setError);
        return {
          success: false,
          error: 'Failed to authenticate. Please try logging in.',
        };
      }

      if (sessionData.session) {
        console.log('✅ Session set successfully');

        setUser(sessionData.session.user);
        setIsAuthenticated(true);

        await SecureStore.setItemAsync(
          'supabaseSession',
          JSON.stringify(sessionData.session)
        );

        // ✅ Fetch user profile ONCE
        console.log('📊 Fetching profile after signup...');
        await useUserStore.getState().fetchProfile(sessionData.session.user.id);

        console.log(
          '✅ Verification complete - navigation handled by _layout.tsx'
        );
        // ✅ Don't navigate here - let _layout.tsx handle it automatically
        return { success: true };
      }
    }

    // This shouldn't happen anymore since Edge Function always returns session
    console.error(
      '⚠️ No session in Edge Function response - this is unexpected'
    );
    return {
      success: false,
      error:
        'Account created but authentication failed. Please try logging in.',
    };
  };

  // ✅ Sign-out using auth service
  const logout = async () => {
    const result = await authService.signOut();

    if (result.success) {
      await SecureStore.deleteItemAsync('supabaseSession');
      useUserStore.getState().clearProfile();
      setIsAuthenticated(false);
      setUser(null);
      // ✅ Navigation handled by _layout.tsx
    }
  };

  //  Local onboarding
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      setHasCompletedOnboarding(true);
      router.replace('/login');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  // ✅ Show splash screen while loading
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.splashText}>Loading LUAGRO...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        hasCompletedOnboarding,
        user,
        isLoading,
        login,
        signup,
        verifyOtp,
        resendOtp,
        verifyEmailOtp,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  splashText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
