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
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Sun, Moon, Smartphone, HelpCircle } from 'lucide-react-native';

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

  async function updateSettings(
    updates: Partial<AppSettings>
  ) {
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
      setError(err instanceof Error ? err.message : 'Failed to update settings');
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
        settings.theme === theme && styles.selectedTheme,
      ]}
      onPress={() => updateSettings({ theme })}>
      <Icon
        size={24}
        color={settings.theme === theme ? '#007AFF' : '#8E8E93'}
      />
      <Text
        style={[
          styles.themeLabel,
          settings.theme === theme && styles.selectedThemeLabel,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Appearance</Text>
        <View style={styles.themeContainer}>
          <ThemeOption theme="light" icon={Sun} label="Light" />
          <ThemeOption theme="dark" icon={Moon} label="Dark" />
          <ThemeOption theme="system" icon={Smartphone} label="System" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={settings.notifications_enabled}
            onValueChange={(value) =>
              updateSettings({ notifications_enabled: value })
            }
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity
          style={styles.linkItem}
          onPress={() => router.push('/help')}>
          <HelpCircle size={20} color="#8E8E93" />
          <Text style={styles.linkText}>Help and Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
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
    color: '#8E8E93',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTheme: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FF',
  },
  themeLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  selectedThemeLabel: {
    color: '#007AFF',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
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
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
});
