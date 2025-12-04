import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAddressStore } from '@/stores/addressStore';
import type { Address } from '@/stores/addressStore';
import AppHeader from '@/components/AppHeader';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';

export default function Delivery() {
  const { colors } = useTheme();
  const router = useRouter();

  const { addresses, selectedId, removeAddress, selectAddress } =
    useAddressStore();

  const handleRemove = (id: string) => {
    Alert.alert(
      'Remove address',
      'Are you sure you want to remove this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeAddress(id);
          },
        },
      ]
    );
  };

  const handleSelect = (id: string) => {
    if (selectedId === id) selectAddress(null);
    else selectAddress(id);
  };

  const renderItem = ({ item }: { item: Address }) => {
    const selected = selectedId === item.id;
    return (
      <TouchableOpacity
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.9}
        style={[
          styles.card,
          { backgroundColor: colors.card },
          selected ? { borderWidth: 2, borderColor: colors.secondary } : {},
        ]}
      >
        <View style={styles.cardContent}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>
            {item.label}
          </Text>
          <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>
            {item.address}
          </Text>
        </View>
        {selected ? (
          <View style={styles.checkWrapper}>
            <Check size={18} color={colors.secondary} />
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => handleRemove(item.id)}
            style={styles.removeButton}
          >
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader title="Delivery Address" />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={[styles.container, { gap: 20 }]}>
          {addresses.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              No addresses yet. Add one below.
            </Text>
          ) : (
            <View>
              {addresses.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {renderItem({ item })}
                  {idx < addresses.length - 1 && (
                    <View style={{ height: 12 }} />
                  )}
                </React.Fragment>
              ))}
              <View style={{ height: 20 }} />
            </View>
          )}

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.secondary }]}
            onPress={() =>
              router.push({
                pathname: 'newaddress' as any,
              })
            }
          >
            <Text style={styles.addButtonText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardAddress: {
    fontSize: 14,
    marginTop: 4,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  checkWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#EF4444',
    fontWeight: '600',
  },
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
