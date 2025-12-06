import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Wallet,
  Building2,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import PaystackPaymentModal from '@/components/PaystackPaymentModal';
import { verifyPayment, generateReference } from '@/lib/paystack';
import { router } from 'expo-router';

interface PaymentMethod {
  id: string;
  type: string;
  card_last_four: string;
  card_brand: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  payment_provider: string;
}

export default function PaymentScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const { colors } = useTheme();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  async function fetchPaymentMethods() {
    try {
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to view payment methods');
        setLoading(false);
        return;
      }

      setUserEmail(user.email || '');

      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPaymentMethods(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load payment methods'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchPaymentMethods();
    setRefreshing(false);
  }

  async function handleAddPaymentMethod() {
    Alert.alert(
      'Add Payment Method',
      'Choose how you want to add funds or payment methods',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Card',
          onPress: () => {
            const reference = generateReference();
            setPaymentReference(reference);
            setShowPaystackModal(true);
          },
        },
        {
          text: 'Virtual Account',
          onPress: () => router.push('/(tabs)/(profile)/virtualAccount'),
        },
      ]
    );
  }

  async function handlePaymentSuccess(response: any) {
    try {
      setShowPaystackModal(false);

      // Verify payment on backend
      const result = await verifyPayment(paymentReference);

      if (result.status) {
        Alert.alert('Success', 'Payment method added successfully!', [
          {
            text: 'OK',
            onPress: () => fetchPaymentMethods(),
          },
        ]);
      } else {
        Alert.alert('Error', 'Payment verification failed');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to verify payment'
      );
    }
  }

  function handlePaymentCancel() {
    setShowPaystackModal(false);
    Alert.alert('Cancelled', 'Payment was cancelled');
  }

  async function deletePaymentMethod(id: string, cardInfo: string) {
    Alert.alert(
      'Delete Payment Method',
      `Are you sure you want to remove ${cardInfo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: deleteError } = await supabase
                .from('payment_methods')
                .update({ is_active: false })
                .eq('id', id);

              if (deleteError) throw deleteError;

              setPaymentMethods((prev) =>
                prev.filter((item) => item.id !== id)
              );
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : 'Failed to delete payment method'
              );
            }
          },
        },
      ]
    );
  }

  async function setDefaultPaymentMethod(id: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Clear all defaults first
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error: updateError } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', id);

      if (updateError) throw updateError;

      fetchPaymentMethods();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to set default card'
      );
    }
  }

  const getCardBrandColor = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return '#1A1F71';
    if (brandLower.includes('mastercard')) return '#EB001B';
    if (brandLower.includes('verve')) return '#EE312A';
    return '#059669';
  };

  const isCardExpired = (month: number, year: number) => {
    const now = new Date();
    const expiry = new Date(year, month - 1);
    return expiry < now;
  };

  const renderItem = ({ item }: { item: PaymentMethod }) => {
    const expired = isCardExpired(item.card_exp_month, item.card_exp_year);
    const cardInfo = `${item.card_brand} •••• ${item.card_last_four}`;

    return (
      <TouchableOpacity
        style={[
          styles.cardItem,
          item.is_default && styles.defaultCard,
          expired && styles.expiredCard,
        ]}
        onPress={() => !expired && setDefaultPaymentMethod(item.id)}
        activeOpacity={0.7}
        disabled={expired}
      >
        <View
          style={[
            styles.cardIcon,
            { backgroundColor: getCardBrandColor(item.card_brand) + '15' },
          ]}
        >
          <CreditCard size={20} color={getCardBrandColor(item.card_brand)} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardBrand}>{item.card_brand}</Text>
          <Text style={styles.cardNumber}>•••• {item.card_last_four}</Text>
          <Text style={[styles.cardExpiry, expired && styles.expiredText]}>
            Expires {item.card_exp_month}/{item.card_exp_year}
          </Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Check size={12} color="#059669" />
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
          {expired && (
            <View style={styles.expiredBadge}>
              <AlertCircle size={12} color="#EF4444" />
              <Text style={styles.expiredBadgeText}>Expired</Text>
            </View>
          )}
        </View>

        {item.is_default && !expired && <Check size={20} color="#059669" />}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deletePaymentMethod(item.id, cardInfo)}
        >
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Payment Methods" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Payment Methods" />

      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchPaymentMethods}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={paymentMethods}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <CreditCard size={48} color="#D1D5DB" />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No payment methods
            </Text>
            <Text style={styles.emptySubtext}>
              Add a payment method for faster checkout
            </Text>
          </View>
        }
      />

      <View style={styles.securityNote}>
        <AlertCircle size={16} color="#6B7280" />
        <Text style={styles.securityText}>
          Your payment information is secured and encrypted
        </Text>
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.virtualAccountButton}
          onPress={() => router.push('/(tabs)/(profile)/virtualAccount')}
          activeOpacity={0.8}
        >
          <Wallet size={20} color="#059669" />
          <Text style={styles.virtualAccountButtonText}>Virtual Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPaymentMethod}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Card</Text>
        </TouchableOpacity>
      </View>

      <PaystackPaymentModal
        visible={showPaystackModal}
        email={userEmail}
        amount={100} // ₦1.00 verification charge
        reference={paymentReference}
        channels={['card']}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
        onClose={() => setShowPaystackModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  defaultCard: {
    borderColor: '#059669',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  expiredCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    opacity: 0.7,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    color: '#1F2937',
    textTransform: 'uppercase',
  },
  cardNumber: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  expiredText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  defaultText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  expiredBadgeText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  virtualAccountButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#059669',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  virtualAccountButtonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
  },
  retryText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1F2937',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  securityNote: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
});
