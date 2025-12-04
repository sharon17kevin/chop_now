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

      // Check if user already has a pending application
      const { data: existingApp, error: checkError } = await supabase
        .from('vendor_applications')
        .select('id, status')
        .eq('user_id', profile.id)
        .eq('status', 'pending')
        .single();

      if (existingApp) {
        Alert.alert(
          'Application Already Submitted',
          'You already have a pending vendor application. Please wait for admin review.',
          [{ text: 'OK' }]
        );
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
              router.back();
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
});
