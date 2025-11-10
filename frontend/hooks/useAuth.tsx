import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { useUserStore } from '../stores/useUserStore';
import * as authService from '../services/auth';

// ✅ Using expo-secure-store for sensitive session tokens
// AsyncStorage still used for non-sensitive data like onboarding state

interface AuthContextType {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  user: any | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
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

    const initAuth = async () => {
      try {
        // ✅ Use Supabase as the source of truth for session
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;

        if (mounted) {
          if (session) {
            setUser(session.user);
            setIsAuthenticated(true);
            // ✅ Persist session securely
            await SecureStore.setItemAsync(
              'supabaseSession',
              JSON.stringify(session)
            );

            // ✅ Fetch user profile and role
            useUserStore.getState().fetchProfile(session.user.id);
          } else {
            setUser(null);
            setIsAuthenticated(false);
            await SecureStore.deleteItemAsync('supabaseSession');
            useUserStore.getState().clearProfile();
          }

          // Restore onboarding state (non-sensitive, can use AsyncStorage)
          const onboardingCompleted = await AsyncStorage.getItem(
            'onboardingCompleted'
          );
          setHasCompletedOnboarding(onboardingCompleted === 'true');
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
          setHasCompletedOnboarding(false);
          useUserStore.getState().clearProfile();
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // ✅ Sync with Supabase auth state changes (login/logout/token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);

        // ✅ Persist session securely
        if (currentUser) {
          await SecureStore.setItemAsync(
            'supabaseSession',
            JSON.stringify(session)
          );
          // ✅ Fetch/refresh profile when session changes
          useUserStore.getState().fetchProfile(currentUser.id);
        } else {
          await SecureStore.deleteItemAsync('supabaseSession');
          useUserStore.getState().clearProfile();
        }
      }
    );

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

      router.replace('/(tabs)' as any);
    }

    return { success: true };
  };

  // ✅ Sign-up using auth service
  const signup = async (name: string, email: string, password: string) => {
    const result = await authService.signUp(email, password, name, 'customer');

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

      router.replace('/(tabs)' as any);
    }

    return { success: true };
  };

  // ✅ Sign-out using auth service
  const logout = async () => {
    const result = await authService.signOut();

    if (result.success) {
      await SecureStore.deleteItemAsync('supabaseSession');
      useUserStore.getState().clearProfile();
      setIsAuthenticated(false);
      setUser(null);
      router.replace('/login');
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

  if (isLoading) return null; // could render a splash screen

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        hasCompletedOnboarding,
        user,
        login,
        signup,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
