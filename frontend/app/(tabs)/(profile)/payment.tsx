import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { CreditCard, Plus, Trash2, Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';

interface PaymentMethod {
  id: string;
  type: string;
  card_last_four: string;
  card_brand: string;
  is_default: boolean;
}

export default function PaymentScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  
  const { colors } = useTheme();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  async function fetchPaymentMethods() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to view payment methods');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
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

  async function addPaymentMethod() {
    try {
      if (cardNumber.length < 4) {
        setError('Please enter a valid card number');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to add payment method');
        return;
      }

      const lastFour = cardNumber.slice(-4);
      const isFirstCard = paymentMethods.length === 0;

      const { error: insertError } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          type: 'card',
          card_last_four: lastFour,
          card_brand: cardBrand || 'Visa',
          is_default: isFirstCard,
        });

      if (insertError) throw insertError;

      setModalVisible(false);
      setCardNumber('');
      setCardBrand('');
      fetchPaymentMethods();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add payment method'
      );
    }
  }

  async function deletePaymentMethod(id: string) {
    try {
      const { error: deleteError } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPaymentMethods((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete payment method'
      );
    }
  }

  async function setDefaultPaymentMethod(id: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

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

  const renderItem = ({ item }: { item: PaymentMethod }) => (
    <TouchableOpacity
      style={[styles.cardItem, item.is_default && styles.defaultCard]}
      onPress={() => setDefaultPaymentMethod(item.id)}>
      <CreditCard size={24} color="#007AFF" />
      <View style={styles.cardInfo}>
        <Text style={styles.cardBrand}>{item.card_brand}</Text>
        <Text style={styles.cardNumber}>•••• {item.card_last_four}</Text>
        {item.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      {item.is_default && (
        <Check size={20} color="#34C759" style={styles.checkIcon} />
      )}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deletePaymentMethod(item.id)}>
        <Trash2 size={20} color="#FF3B30" />
      </TouchableOpacity>
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
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader title="Payment Methods" />
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={paymentMethods}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No payment methods added</Text>
            <Text style={styles.emptySubtext}>
              Add a payment method to make purchases easier
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}>
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Payment Method</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Payment Method</Text>

            <TextInput
              style={styles.input}
              placeholder="Card Number"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
              maxLength={16}
            />

            <TextInput
              style={styles.input}
              placeholder="Card Brand (e.g., Visa, Mastercard)"
              value={cardBrand}
              onChangeText={setCardBrand}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setCardNumber('');
                  setCardBrand('');
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={addPaymentMethod}>
                <Text style={styles.saveButtonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  defaultCard: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    color: '#8E8E93',
  },
  defaultBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  defaultText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  checkIcon: {
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
