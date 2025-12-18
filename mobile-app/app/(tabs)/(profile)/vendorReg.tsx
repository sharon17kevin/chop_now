import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, Store } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VendorReg() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [formData, setFormData] = useState({
    farmName: '',
    farmLocation: '',
    farmDescription: '',
    businessPhone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    deliveryZones: '',
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true },
    },
  });

  // Check for existing application on mount
  React.useEffect(() => {
    checkExistingApplication();
  }, []);

  const checkExistingApplication = async () => {
    try {
      setCheckingStatus(true);
      
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('user_id', profile.id)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setExistingApplication(data);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.farmName.trim()) {
      Alert.alert('Required', 'Business/Farm name is required');
      return false;
    }
    if (!formData.businessPhone.trim()) {
      Alert.alert('Required', 'Business phone number is required');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Required', 'Business address is required');
      return false;
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      Alert.alert('Required', 'City and State are required');
      return false;
    }
    if (!formData.farmDescription.trim()) {
      Alert.alert('Required', 'Please provide a description of your business');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (!profile?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Parse delivery zones from comma-separated string
      const deliveryZonesArray = formData.deliveryZones
        .split(',')
        .map((zone) => zone.trim())
        .filter((zone) => zone.length > 0);

      // Insert vendor application for admin review
      const { error } = await supabase.from('vendor_applications').insert({
        user_id: profile.id,
        farm_name: formData.farmName,
        farm_location: formData.farmLocation,
        farm_description: formData.farmDescription,
        business_phone: formData.businessPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        delivery_zones: deliveryZonesArray,
        business_hours: formData.businessHours,
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert(
        'Application Submitted! ✅',
        'Your vendor application has been submitted for review. Our admin team will review it within 2-3 business days. You will be notified via in-app notification once approved.',
        [
          {
            text: 'OK',
            onPress: () => {
              checkExistingApplication(); // Refresh status
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting vendor application:', error);

      if (error.code === '23505') {
        // Unique constraint violation
        Alert.alert(
          'Duplicate Application',
          'You already have a pending application. Please wait for admin review.'
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to submit application');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.filter }]}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Become a Vendor
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {checkingStatus ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Checking application status...
          </Text>
        </View>
      ) : existingApplication ? (
        // Show existing application status
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: colors.card,
                borderColor:
                  existingApplication.status === 'pending'
                    ? colors.warning || '#F59E0B'
                    : colors.success,
              },
            ]}
          >
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      existingApplication.status === 'pending'
                        ? (colors.warning || '#F59E0B') + '20'
                        : colors.success + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        existingApplication.status === 'pending'
                          ? colors.warning || '#F59E0B'
                          : colors.success,
                    },
                  ]}
                >
                  {existingApplication.status === 'pending'
                    ? '⏳ Under Review'
                    : '✅ Approved'}
                </Text>
              </View>
            </View>

            <Text style={[styles.statusTitle, { color: colors.text }]}>
              Your Vendor Application
            </Text>

            {existingApplication.status === 'pending' ? (
              <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                Your application is currently under review. Our admin team will review it within
                2-3 business days. You will be notified once a decision is made.
              </Text>
            ) : (
              <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                Congratulations! Your vendor application has been approved. You can now start
                listing products and managing your store.
              </Text>
            )}

            <View style={styles.applicationDetails}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Business Name:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {existingApplication.farm_name}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Submitted:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {new Date(existingApplication.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              {existingApplication.city && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Location:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {existingApplication.city}, {existingApplication.state}
                  </Text>
                </View>
              )}
            </View>

            {existingApplication.status === 'approved' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                onPress={() => router.push('/(tabs)/sell')}
              >
                <Text style={styles.actionButtonText}>Go to My Store</Text>
              </TouchableOpacity>
            )}

            {existingApplication.status === 'pending' && (
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => router.back()}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  Go Back
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View
            style={[
              styles.helpBox,
              { backgroundColor: colors.filter, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.helpTitle, { color: colors.text }]}>Need Help?</Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              If you have questions about your application or need to update your information,
              please contact our support team.
            </Text>
          </View>
        </ScrollView>
      ) : (
        // Show registration form (existing code)
        <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View
            style={[
              styles.infoBanner,
              {
                backgroundColor: colors.secondary + '20',
                borderColor: colors.secondary,
              },
            ]}
          >
            <Store size={24} color={colors.secondary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Vendor Registration
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Fill out this form to register as a vendor. Your application
                will be reviewed within 2-3 business days.
              </Text>
            </View>
          </View>

          {/* Business Information Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Business Information
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Business/Farm Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g., Fresh Farms Ltd"
                placeholderTextColor={colors.textTetiary}
                value={formData.farmName}
                onChangeText={(text) => updateField('farmName', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Business Description *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Describe your business, products you sell, etc."
                placeholderTextColor={colors.textTetiary}
                value={formData.farmDescription}
                onChangeText={(text) => updateField('farmDescription', text)}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Farm/Business Location
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g., Km 20 Ibadan-Lagos Road"
                placeholderTextColor={colors.textTetiary}
                value={formData.farmLocation}
                onChangeText={(text) => updateField('farmLocation', text)}
              />
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Contact Information
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Business Phone *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="+234 XXX XXX XXXX"
                placeholderTextColor={colors.textTetiary}
                value={formData.businessPhone}
                onChangeText={(text) => updateField('businessPhone', text)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Business Address *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Full business address"
                placeholderTextColor={colors.textTetiary}
                value={formData.address}
                onChangeText={(text) => updateField('address', text)}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  City *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="e.g., Ibadan"
                  placeholderTextColor={colors.textTetiary}
                  value={formData.city}
                  onChangeText={(text) => updateField('city', text)}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  State *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="e.g., Oyo"
                  placeholderTextColor={colors.textTetiary}
                  value={formData.state}
                  onChangeText={(text) => updateField('state', text)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Postal Code
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Optional"
                placeholderTextColor={colors.textTetiary}
                value={formData.postalCode}
                onChangeText={(text) => updateField('postalCode', text)}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Delivery Information Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Delivery Information
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Delivery Zones
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g., Ibadan, Abeokuta, Lagos"
                placeholderTextColor={colors.textTetiary}
                value={formData.deliveryZones}
                onChangeText={(text) => updateField('deliveryZones', text)}
              />
              <Text style={[styles.helperText, { color: colors.textTetiary }]}>
                Separate multiple zones with commas
              </Text>
            </View>
          </View>

          {/* Business Hours Note */}
          <View
            style={[
              styles.noteBox,
              { backgroundColor: colors.filter, borderColor: colors.border },
            ]}
          >
            <Clock size={20} color={colors.textSecondary} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Business hours will be set to 9:00 AM - 6:00 PM (Mon-Sat) by
              default. You can update them later in your profile settings.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[
              styles.submitButton,
              { backgroundColor: colors.secondary },
              loading && { opacity: 0.6 },
            ]}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Application</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.textTetiary }]}>
            By submitting this application, you agree to our vendor terms and
            conditions. You&apos;ll be notified via email once your application
            is reviewed.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  noteBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  statusCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  applicationDetails: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },
});