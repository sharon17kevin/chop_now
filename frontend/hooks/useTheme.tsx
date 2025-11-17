import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FilterXIcon } from 'lucide-react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => Promise<void>;
  colors: typeof lightColors;
}

const lightColors = {
  primary: '#f6891f', // Orange as primary (central color)
  secondary: '#f6891f', // Keep secondary orange
  background: '#FAFAF9',
  card: '#FFFFFF',
  filter: '#F5F5F4',
  text: '#1C1917',
  textSecondary: '#78716C',
  textTetiary: '#A29F9C',
  textTrans: '#1C1917',
  textTransSub: '#78716C',
  invertIcon: '#F5F5F4',
  highlight: '#f6891f', // Orange highlights
  border: '#E7E5E4',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#EA580C', // Slightly darker orange for warnings
  info: '#0284C7',
  modal: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.4)',
  input: '#FFFFFF',
  inputBorder: '#D6D3D1',
  button: '#f6891f', // Orange buttons
  buttonText: '#FFFFFF',
  disabled: '#D6D3D1',
  errorBackground: '#FEF2F2',
  destructiveBackground: '#FEF2F2',
};

const darkColors = {
  primary: '#FB923C', // Lighter orange for dark theme
  secondary: '#f6891f', // Keep the main orange color
  background: '#0F172A',
  card: '#1E293B',
  filter: '#334155',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTetiary: '#94A3B8',
  textTrans: '#F8FAFC',
  textTransSub: '#CBD5E1',
  invertIcon: '#334155',
  highlight: '#FB923C', // Lighter orange highlights
  border: '#475569',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#FB923C', // Match lighter orange
  info: '#06B6D4',
  modal: '#1E293B',
  overlay: 'rgba(0, 0, 0, 0.6)',
  input: '#334155',
  inputBorder: '#475569',
  button: '#FB923C', // Lighter orange buttons
  buttonText: '#FFFFFF',
  disabled: '#64748B',
  errorBackground: 'rgba(239, 68, 68, 0.1)',
  destructiveBackground: 'rgba(239, 68, 68, 0.1)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme, systemColorScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setThemeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: ThemeMode) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
