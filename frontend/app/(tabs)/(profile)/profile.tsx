import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  User,
  Save,
  Mail,
  Phone,
  MapPin,
  Edit,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  address: string;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to view your profile');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      } else {
        setProfile((prev) => ({
          ...prev,
          email: user.email || '',
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      setSaving(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to update your profile');
        return;
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
        });

        if (insertError) throw insertError;
      }

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.filter,
            width: 40,
            height: 40,
            borderRadius: 20,
            padding: 8,
            elevation: 3,
            shadowColor: colors.text,
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.filter }]}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Edit size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading profile...
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

            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.filter }]}>
                <User size={48} color={colors.textSecondary} />
              </View>
              {isEditing && (
                <TouchableOpacity
                  style={[
                    styles.changePhotoButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Full Name
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, shadowColor: colors.text },
                ]}
              >
                <User size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={profile.full_name}
                  onChangeText={(text) =>
                    setProfile({ ...profile, full_name: text })
                  }
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textTetiary}
                  editable={isEditing}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, shadowColor: colors.text },
                ]}
              >
                <Mail size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={profile.email}
                  onChangeText={(text) =>
                    setProfile({ ...profile, email: text })
                  }
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTetiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={isEditing}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Phone
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, shadowColor: colors.text },
                ]}
              >
                <Phone size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={profile.phone}
                  onChangeText={(text) =>
                    setProfile({ ...profile, phone: text })
                  }
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textTetiary}
                  keyboardType="phone-pad"
                  editable={isEditing}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Address
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, shadowColor: colors.text },
                ]}
              >
                <MapPin size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={profile.address}
                  onChangeText={(text) =>
                    setProfile({ ...profile, address: text })
                  }
                  placeholder="Enter your address"
                  placeholderTextColor={colors.textTetiary}
                  multiline
                  editable={isEditing}
                />
              </View>
            </View>

            {isEditing && (
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.secondary,
                    shadowColor: colors.primary,
                  },
                ]}
                onPress={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
