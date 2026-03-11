import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { useUserStore } from '../stores/useUserStore';
import * as authService from '../services/auth/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  user: any | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (
    email: string,
    code: string,
    name: string,
    password: string,
    role: 'customer' | 'vendor',
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

  // Restore session and onboarding state
  useEffect(() => {
    let mounted = true;
    let isInitializing = true;

    const initAuth = async () => {
      try {
        console.log('Initializing auth state...');

        // Parallelize session and onboarding checks
        const [sessionResult, onboardingCompleted] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem('onboardingCompleted'),
        ]);

        if (!mounted) return;

        const session = sessionResult.data?.session ?? null;

        setHasCompletedOnboarding(onboardingCompleted === 'true');

        if (session) {
          console.log('Session found, user:', session.user.email);

          setUser(session.user);
          setIsAuthenticated(true);

          // Fetch profile in background (non-blocking)
          useUserStore
            .getState()
            .fetchProfile(session.user.id)
            .catch((error) => {
              console.error('Profile fetch failed:', error);
            });
        } else {
          console.log('No session found');
          setUser(null);
          setIsAuthenticated(false);
          useUserStore.getState().clearProfile();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
          setHasCompletedOnboarding(false);
          useUserStore.getState().clearProfile();
        }
      } finally {
        if (mounted) {
          console.log('Auth initialization complete');
          isInitializing = false;
          setIsLoading(false);
        }
      }
    };

    // Sync with Supabase auth state changes (login/logout/token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event);

        // Skip INITIAL_SESSION during initialization to prevent race conditions
        if (event === 'INITIAL_SESSION' && isInitializing) {
          return;
        }

        const currentUser = session?.user ?? null;

        if (!isInitializing || currentUser) {
          setUser(currentUser);
          setIsAuthenticated(!!currentUser);

          if (currentUser && session) {
            // Refresh profile on token refresh or user updates
            if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              try {
                await useUserStore.getState().fetchProfile(currentUser.id);
              } catch (error) {
                console.error('Profile refresh failed:', error);
              }
            }
          } else if (event !== 'INITIAL_SESSION') {
            // Actual logout — clear profile
            useUserStore.getState().clearProfile();
          }
        }
      },
    );

    initAuth();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Sign-in
  const login = async (email: string, password: string) => {
    try {
      const result = await authService.signIn(email, password);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        setUser(result.data.user);
        setIsAuthenticated(true);

        // Fetch user profile and role
        await useUserStore.getState().fetchProfile(result.data.user.id);
      }

      return { success: true };
    } catch (error: any) {
      console.log('Login error in useAuth:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during login',
      };
    }
  };

  // Verify Email OTP (custom edge function flow)
  const verifyEmailOtp = async (
    email: string,
    code: string,
    name: string,
    password: string,
    role: 'customer' | 'vendor',
  ) => {
    console.log('verifyEmailOtp - Starting verification...');

    // Call Edge Function to verify and create user
    const result = await authService.verifyEmailOtp(
      email,
      code,
      name,
      password,
      role,
    );

    if (!result.success) {
      console.error('Email OTP verification failed:', result.error);
      return { success: false, error: result.error };
    }

    console.log('User created:', result.data?.user?.id);

    // Check if Edge Function returned a session
    if (result.data?.session) {
      // Set the session in Supabase client (SDK persists to SecureStore automatically)
      const { data: sessionData, error: setError } =
        await supabase.auth.setSession({
          access_token: result.data.session.access_token,
          refresh_token: result.data.session.refresh_token,
        });

      if (setError) {
        console.error('Failed to set session:', setError);
        return {
          success: false,
          error: 'Failed to authenticate. Please try logging in.',
        };
      }

      if (sessionData.session) {
        setUser(sessionData.session.user);
        setIsAuthenticated(true);

        // Fetch user profile
        await useUserStore.getState().fetchProfile(sessionData.session.user.id);

        return { success: true };
      }
    }

    console.error('No session in Edge Function response');
    return {
      success: false,
      error:
        'Account created but authentication failed. Please try logging in.',
    };
  };

  // Sign in with Google OAuth
  const loginWithGoogle = async () => {
    try {
      const result = await authService.signInWithGoogle();

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        setUser(result.data.user);
        setIsAuthenticated(true);

        // Fetch user profile
        await useUserStore.getState().fetchProfile(result.data.user.id);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Google login error:', error);
      return {
        success: false,
        error: error.message || 'Google sign-in failed',
      };
    }
  };

  // Sign in with Apple OAuth
  const loginWithApple = async () => {
    try {
      const result = await authService.signInWithApple();

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        setUser(result.data.user);
        setIsAuthenticated(true);

        // Fetch user profile
        await useUserStore.getState().fetchProfile(result.data.user.id);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Apple login error:', error);
      return {
        success: false,
        error: error.message || 'Apple sign-in failed',
      };
    }
  };

  // Sign-out
  const logout = async () => {
    const result = await authService.signOut();

    if (result.success) {
      useUserStore.getState().clearProfile();
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Local onboarding
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

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.splashText}>Loading...</Text>
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
        loginWithGoogle,
        loginWithApple,
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
