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
  Image,
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
  Camera,
  ImageIcon,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/lib/uploadService';
import { useUserStore } from '@/stores/useUserStore';

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  profile_image?: string;
  banner_image?: string;
  role?: 'customer' | 'vendor' | 'admin' | null;
  verified?: boolean;
  farm_name?: string;
  farm_location?: string;
  farm_description?: string;
  business_phone?: string;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const {
    profile: userProfile,
    isLoadingProfile,
    updateProfile: updateStoreProfile,
  } = useUserStore();
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // Sync local state with store profile
  useEffect(() => {
    if (userProfile) {
      setProfile({
        full_name: userProfile.full_name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        profile_image: userProfile.profile_image || '',
        banner_image: userProfile.banner_image || '',
        role: userProfile.role,
        verified: userProfile.verified,
        farm_name: userProfile.farm_name || '',
        farm_location: userProfile.farm_location || '',
        farm_description: userProfile.farm_description || '',
        business_phone: userProfile.business_phone || '',
      });
    }
  }, [userProfile]);

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
            profile_image: profile.profile_image,
            banner_image: profile.banner_image,
            farm_name: profile.farm_name,
            farm_location: profile.farm_location,
            farm_description: profile.farm_description,
            business_phone: profile.business_phone,
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
          profile_image: profile.profile_image,
          banner_image: profile.banner_image,
          farm_name: profile.farm_name,
          farm_location: profile.farm_location,
          farm_description: profile.farm_description,
          business_phone: profile.business_phone,
        });

        if (insertError) throw insertError;
      }

      // Update the store with new profile data
      updateStoreProfile({
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        profile_image: profile.profile_image,
        banner_image: profile.banner_image,
        farm_name: profile.farm_name,
        farm_location: profile.farm_location,
        farm_description: profile.farm_description,
        business_phone: profile.business_phone,
      });

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function pickAvatar() {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant photo library access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAvatar(true);
        const uri = result.assets[0].uri;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const imageUrl = await uploadImage(uri, `avatars/${user.id}`);
        setProfile({ ...profile, profile_image: imageUrl });
        Alert.alert('Success', 'Avatar uploaded successfully');
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to upload avatar'
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function pickBanner() {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant photo library access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingBanner(true);
        const uri = result.assets[0].uri;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const imageUrl = await uploadImage(uri, `banners/${user.id}`);
        setProfile({ ...profile, banner_image: imageUrl });
        Alert.alert('Success', 'Banner uploaded successfully');
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to upload banner'
      );
    } finally {
      setUploadingBanner(false);
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
        {isLoadingProfile ? (
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

            {/* Banner Image - Vendors Only */}
            {profile.role === 'vendor' && (
              <View style={styles.bannerContainer}>
                {profile.banner_image ? (
                  <Image
                    source={{ uri: profile.banner_image }}
                    style={styles.bannerImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.bannerPlaceholder,
                      { backgroundColor: colors.filter },
                    ]}
                  >
                    <ImageIcon size={40} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.bannerPlaceholderText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Add Banner Image
                    </Text>
                  </View>
                )}
                {isEditing && (
                  <TouchableOpacity
                    style={[
                      styles.changeBannerButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={pickBanner}
                    disabled={uploadingBanner}
                  >
                    {uploadingBanner ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Camera size={16} color="#FFFFFF" />
                        <Text style={styles.changePhotoText}>
                          {profile.banner_image ? 'Change' : 'Add'} Banner
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Avatar */}
            <View
              style={[
                styles.avatarContainer,
                profile.role === 'vendor' && styles.avatarWithBanner,
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.filter }]}>
                {profile.profile_image ? (
                  <Image
                    source={{ uri: profile.profile_image }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <User size={48} color={colors.textSecondary} />
                )}
              </View>
              {isEditing && (
                <TouchableOpacity
                  style={[
                    styles.changePhotoButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={pickAvatar}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Camera size={16} color="#FFFFFF" />
                      <Text style={styles.changePhotoText}>
                        {profile.profile_image ? 'Change' : 'Add'} Photo
                      </Text>
                    </>
                  )}
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

            {/* Vendor Information - Only for verified vendors */}
            {profile.role === 'vendor' && profile.verified && (
              <>
                <View
                  style={[
                    styles.sectionHeader,
                    { borderBottomColor: colors.filter },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Vendor Information
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Farm/Business Name
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.card,
                        shadowColor: colors.text,
                      },
                    ]}
                  >
                    <User size={20} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={profile.farm_name}
                      onChangeText={(text) =>
                        setProfile({ ...profile, farm_name: text })
                      }
                      placeholder="Enter your farm or business name"
                      placeholderTextColor={colors.textTetiary}
                      editable={isEditing}
                    />
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Farm/Business Location
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.card,
                        shadowColor: colors.text,
                      },
                    ]}
                  >
                    <MapPin size={20} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={profile.farm_location}
                      onChangeText={(text) =>
                        setProfile({ ...profile, farm_location: text })
                      }
                      placeholder="Enter your farm or business location"
                      placeholderTextColor={colors.textTetiary}
                      editable={isEditing}
                    />
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Business Phone
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.card,
                        shadowColor: colors.text,
                      },
                    ]}
                  >
                    <Phone size={20} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={profile.business_phone}
                      onChangeText={(text) =>
                        setProfile({ ...profile, business_phone: text })
                      }
                      placeholder="Enter your business phone number"
                      placeholderTextColor={colors.textTetiary}
                      keyboardType="phone-pad"
                      editable={isEditing}
                    />
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Farm/Business Description
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.textAreaContainer,
                      {
                        backgroundColor: colors.card,
                        shadowColor: colors.text,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.textArea, { color: colors.text }]}
                      value={profile.farm_description}
                      onChangeText={(text) =>
                        setProfile({ ...profile, farm_description: text })
                      }
                      placeholder="Describe your farm or business, what you sell, your farming practices, etc."
                      placeholderTextColor={colors.textTetiary}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      editable={isEditing}
                    />
                  </View>
                </View>
              </>
            )}

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
  bannerContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerPlaceholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  changeBannerButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarWithBanner: {
    marginTop: -60,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
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
  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  textAreaContainer: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    width: '100%',
    paddingTop: 0,
  },
});
