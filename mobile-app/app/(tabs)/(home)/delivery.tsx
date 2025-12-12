import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, MapPin, Star } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAddressStore } from '@/stores/addressStore';
import { useUserStore } from '@/stores/useUserStore';
import type { Address } from '@/stores/addressStore';
import AppHeader from '@/components/AppHeader';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';

export default function Delivery() {
  const { colors } = useTheme();
  const router = useRouter();

  const {
    addresses,
    selectedId,
    loading,
    error,
    removeAddress,
    selectAddress,
    fetchAddresses,
    setDefaultAddress,
  } = useAddressStore();

  const profile = useUserStore((state) => state.profile);

  useEffect(() => {
    if (profile?.id) {
      fetchAddresses(profile.id);
    }
  }, [profile?.id, fetchAddresses]);

  const handleRemove = (id: string) => {
    Alert.alert(
      'Remove address',
      'Are you sure you want to remove this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAddress(id);
            } catch {
              Alert.alert('Error', 'Failed to remove address');
            }
          },
        },
      ]
    );
  };

  const handleSelect = (id: string) => {
    if (selectedId === id) {
      selectAddress(null);
    } else {
      selectAddress(id);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      Alert.alert('Success', 'Default address updated');
    } catch {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const formatAddress = (addr: Address) => {
    const parts = [addr.street, addr.city, addr.state];
    if (addr.postal_code) parts.push(addr.postal_code);
    return parts.filter(Boolean).join(', ');
  };

  const renderItem = ({ item }: { item: Address }) => {
    const selected = selectedId === item.id;
    const isDefault = item.is_default;

    return (
      <TouchableOpacity
        onPress={() => handleSelect(item.id)}
        onLongPress={() => {
          Alert.alert('Address Options', 'What would you like to do?', [
            {
              text: 'Set as Default',
              onPress: () => handleSetDefault(item.id),
            },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => handleRemove(item.id),
            },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }}
        activeOpacity={0.9}
        style={[
          styles.card,
          { backgroundColor: colors.card },
          selected && { borderWidth: 2, borderColor: colors.secondary },
          isDefault && { borderWidth: 2, borderColor: colors.primary },
        ]}
      >
        <View style={styles.cardHeader}>
          {item.label && (
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              {item.label}
            </Text>
          )}
          {isDefault && (
            <View
              style={[
                styles.defaultBadge,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Star size={12} color={colors.primary} fill={colors.primary} />
              <Text style={[styles.defaultText, { color: colors.primary }]}>
                Default
              </Text>
            </View>
          )}
        </View>

        <View style={styles.addressContent}>
          <MapPin size={16} color={colors.textSecondary} />
          <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>
            {formatAddress(item)}
          </Text>
        </View>

        {selected && (
          <View style={styles.checkWrapper}>
            <Check size={18} color={colors.secondary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Profile address card (if exists)
  const ProfileAddressCard = () => {
    if (!profile?.address) return null;

    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Profile Address
        </Text>
        <View
          style={[styles.card, { backgroundColor: colors.card, opacity: 0.8 }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              From Profile
            </Text>
          </View>
          <View style={styles.addressContent}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>
              {profile.address}
              {profile.city && `, ${profile.city}`}
              {profile.state && `, ${profile.state}`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader title="Delivery Address" />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.container}>
          {loading && addresses.length === 0 ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading addresses...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          ) : (
            <>
              <ProfileAddressCard />

              {addresses.length > 0 && (
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  Saved Addresses
                </Text>
              )}

              {addresses.length === 0 ? (
                <View style={styles.emptyState}>
                  <MapPin size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    No saved addresses
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Add an address to get started
                  </Text>
                </View>
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
                </View>
              )}
            </>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'column',
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardAddress: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  checkWrapper: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  addButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
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
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
});
