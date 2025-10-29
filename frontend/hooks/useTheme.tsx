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
  primary: '#0159B2',
  secondary: '#f6891f',
  background: '#F9FAFB',
  card: '#F9FAFB',
  filter: '#E0E0E0',
  text: '#333333',
  textSecondary: '#917992',
  textTetiary: '#333333',
  textTrans: '#333333',
  textTransSub: '#917992',
  invertIcon:'#E0E0E0',
  highlight: '#d4a418',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#A28F65',
  warning: '#F97316',
  info: '#A28F65',
  modal: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.6)',
  input: '#D4EDEB',
  inputBorder: '#E5E7EB',
  button: '#1E40AF',
  buttonText: '#FFFFFF',
  disabled: '#9CA3AF',
};

const darkColors = {
  primary: '#0159B2',
  secondary: '#f6891f',
  background: '#F9FAFB',
  card: '#F9FAFB',
  filter: '#dfe0df',
  text: '#333333',
  textSecondary: '#917992',
  textTetiary: '#333333',
  textTrans: '#333333',
  textTransSub: '#917992',
  invertIcon:'#E0E0E0',
  highlight: '#d4a418',
  border: '#00dbb1',
  error: '#EF4444',
  success: '#A28F65',
  warning: '#F97316',
  info: '#A28F65',
  modal: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.6)',
  input: '#D4EDEB',
  inputBorder: '#E5E7EB',
  button: '#1E40AF',
  buttonText: '#FFFFFF',
  disabled: '#9CA3AF',
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
