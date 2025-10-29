import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface AuthContextType {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const [authToken, onboardingCompleted] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('onboardingCompleted'),
      ]);

      // More strict validation of auth state
      const isAuthenticated = authToken === 'demo-token'; // Only valid if it's our demo token
      const hasCompletedOnboarding = onboardingCompleted === 'true';

      // Reset states if values are invalid
      if (!isAuthenticated) {
        await AsyncStorage.removeItem('authToken');
      }
      if (!hasCompletedOnboarding) {
        await AsyncStorage.removeItem('onboardingCompleted');
      }

      setIsAuthenticated(isAuthenticated);
      setHasCompletedOnboarding(hasCompletedOnboarding);
    } catch (error) {
      console.error('Error checking auth state:', error);
      // Reset states on error to ensure proper flow
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
      // Clear potentially corrupted storage
      await Promise.all([
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('onboardingCompleted'),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // In a real app, you would make an API call here
      // For demo purposes, we'll just simulate a successful login
      await AsyncStorage.setItem('authToken', 'demo-token');
      setIsAuthenticated(true);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setIsAuthenticated(false);
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

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

  const signup = async (name: string, email: string, password: string) => {
    try {
      // In a real app, you would make an API call here
      // For demo purposes, we'll just simulate a successful signup
      await AsyncStorage.setItem('authToken', 'demo-token');
      setIsAuthenticated(true);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        hasCompletedOnboarding,
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
