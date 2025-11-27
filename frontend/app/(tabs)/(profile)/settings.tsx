import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Sun, Moon, Smartphone, HelpCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import AppHeader from '@/components/AppHeader';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    notifications_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings({
          theme: data.theme as 'light' | 'dark' | 'system',
          notifications_enabled: data.notifications_enabled,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function updateSettings(updates: Partial<AppSettings>) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to update settings');
        return;
      }

      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);

      const { data: existingSettings } = await supabase
        .from('app_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSettings) {
        const { error: updateError } = await supabase
          .from('app_settings')
          .update({
            theme: newSettings.theme,
            notifications_enabled: newSettings.notifications_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert({
            user_id: user.id,
            theme: newSettings.theme,
            notifications_enabled: newSettings.notifications_enabled,
          });

        if (insertError) throw insertError;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update settings'
      );
    }
  }

  const ThemeOption = ({
    theme,
    icon: Icon,
    label,
  }: {
    theme: 'light' | 'dark' | 'system';
    icon: any;
    label: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        { backgroundColor: colors.card, shadowColor: colors.text },
        settings.theme === theme && {
          borderColor: colors.primary,
          backgroundColor: colors.filter,
        },
      ]}
      onPress={() => updateSettings({ theme })}
    >
      <Icon
        size={24}
        color={settings.theme === theme ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          styles.themeLabel,
          { color: colors.textSecondary },
          settings.theme === theme && { color: colors.primary },
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
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading settings...
            </Text>
          </View>
        ) : (
          <>
            {error && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: colors.errorBackground },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                App Appearance
              </Text>
              <View style={styles.themeContainer}>
                <ThemeOption theme="light" icon={Sun} label="Light" />
                <ThemeOption theme="dark" icon={Moon} label="Dark" />
                <ThemeOption theme="system" icon={Smartphone} label="System" />
              </View>
            </View>

            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Notifications
              </Text>
              <View
                style={[
                  styles.settingItem,
                  { backgroundColor: colors.card, shadowColor: colors.text },
                ]}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Push Notifications
                </Text>
                <Switch
                  value={settings.notifications_enabled}
                  onValueChange={(value) =>
                    updateSettings({ notifications_enabled: value })
                  }
                  trackColor={{ false: colors.disabled, true: colors.success }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
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
  errorBanner: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
