import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Switch,
} from 'react-native';
import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAddressStore } from '@/stores/addressStore';
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'expo-router';
import type { Address } from '@/stores/addressStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import AppHeader from '@/components/AppHeader';

export default function NewAddress() {
  const { colors } = useTheme();
  const [label, setLabel] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const { addAddress } = useAddressStore();
  const profile = useUserStore((state) => state.profile);

  const handleAdd = async () => {
    const trimmedLabel = label.trim();
    const trimmedStreet = street.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();

    if (!trimmedStreet || !trimmedCity || !trimmedState) {
      Alert.alert(
        'Missing fields',
        'Please provide street address, city, and state.'
      );
      return;
    }

    if (!profile?.id) {
      Alert.alert('Error', 'You must be logged in to add an address.');
      return;
    }

    const newAddress: Omit<Address, 'id' | 'created_at' | 'updated_at'> = {
      user_id: profile.id,
      label: trimmedLabel || null,
      street: trimmedStreet,
      city: trimmedCity,
      state: trimmedState,
      country: 'Nigeria',
      postal_code: postalCode.trim() || null,
      is_default: isDefault,
    };

    try {
      setSaving(true);
      await addAddress(newAddress);
      Alert.alert('Success', 'Address added successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader title="Add New Address" />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={[styles.form, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Label (Optional)
          </Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Home, Work, Parents..."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { borderColor: colors.inputBorder, color: colors.text },
            ]}
            editable={!saving}
          />

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Street Address *
          </Text>
          <TextInput
            value={street}
            onChangeText={setStreet}
            placeholder="123 Main Street, Apartment 4B"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { borderColor: colors.inputBorder, color: colors.text },
            ]}
            editable={!saving}
            multiline
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                City *
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Lagos"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { borderColor: colors.inputBorder, color: colors.text },
                ]}
                editable={!saving}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                State *
              </Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="Lagos"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { borderColor: colors.inputBorder, color: colors.text },
                ]}
                editable={!saving}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Postal Code (Optional)
          </Text>
          <TextInput
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="100001"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { borderColor: colors.inputBorder, color: colors.text },
            ]}
            keyboardType="number-pad"
            editable={!saving}
          />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Set as default address
              </Text>
              <Text
                style={[styles.helperText, { color: colors.textSecondary }]}
              >
                This will be used for deliveries by default
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={isDefault ? colors.primary : colors.textSecondary}
              disabled={saving}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.secondary },
              saving && { opacity: 0.6 },
            ]}
            onPress={handleAdd}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add Address</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  addButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
