import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sun, Moon, Smartphone, HelpCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import AppHeader from '@/components/AppHeader';

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const ThemeOption = ({
    themeMode,
    icon: Icon,
    label,
  }: {
    themeMode: 'light' | 'dark' | 'system';
    icon: any;
    label: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        { backgroundColor: colors.card, shadowColor: colors.text },
        theme === themeMode && {
          borderColor: colors.primary,
          backgroundColor: colors.filter,
        },
      ]}
      onPress={async () => {
        setLoading(true);
        await setTheme(themeMode);
        setLoading(false);
      }}
    >
      <Icon
        size={24}
        color={theme === themeMode ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          styles.themeLabel,
          { color: colors.textSecondary },
          theme === themeMode && { color: colors.primary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            App Appearance
          </Text>
          <View style={styles.themeContainer}>
            <ThemeOption themeMode="light" icon={Sun} label="Light" />
            <ThemeOption themeMode="dark" icon={Moon} label="Dark" />
            <ThemeOption themeMode="system" icon={Smartphone} label="System" />
          </View>
          <Text
            style={[styles.themeDescription, { color: colors.textSecondary }]}
          >
            {theme === 'system'
              ? 'Theme follows your device settings'
              : `Using ${theme} theme`}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Support
          </Text>
          <TouchableOpacity
            style={[
              styles.linkItem,
              { backgroundColor: colors.card, shadowColor: colors.text },
            ]}
            onPress={() =>
              router.push({
                pathname: 'support' as any,
              })
            }
          >
            <HelpCircle size={20} color={colors.textSecondary} />
            <Text style={[styles.linkText, { color: colors.text }]}>
              Help and Support
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  themeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  themeLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  themeDescription: {
    marginTop: 12,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});
