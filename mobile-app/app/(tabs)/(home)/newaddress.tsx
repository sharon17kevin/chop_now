import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAddressStore } from '@/stores/addressStore';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { Address } from '@/stores/addressStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import AppHeader from '@/components/AppHeader';

export default function newaddress() {
  const { colors } = useTheme();
  const [label, setLabel] = useState('');
  const [addr, setAddr] = useState('');

  const router = useRouter();
  const { addAddress } = useAddressStore();

  const handleAdd = async () => {
    const trimmedLabel = label.trim();
    const trimmedAddr = addr.trim();
    if (!trimmedLabel || !trimmedAddr) {
      Alert.alert(
        'Missing fields',
        'Please provide both a label and an address.'
      );
      return;
    }
    const newItem: Address = {
      id: String(Date.now()),
      label: trimmedLabel,
      address: trimmedAddr,
    };
    // add via store (store will persist and set selectedId to the new id)
    addAddress(newItem);
    setLabel('');
    setAddr('');
    
    router.back();
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader title="Add New Address" />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={[styles.form, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Label</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Home, Work, Parents..."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { borderColor: colors.inputBorder, color: colors.text },
            ]}
          />

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Address
          </Text>
          <TextInput
            value={addr}
            onChangeText={setAddr}
            placeholder="123 Main St, City, ZIP"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { borderColor: colors.inputBorder, color: colors.text },
            ]}
          />

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.secondary }]}
            onPress={handleAdd}
          >
            <Text style={styles.addButtonText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
