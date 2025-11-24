import AppHeader from '@/components/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/stores/useUserStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import {
  CheckCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    unit: string;
    vendor_id: string;
    profiles: {
      full_name: string;
    };
  };
}

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('Wallet');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Fetch cart items from database
  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);

      // Get user from Zustand store
      const profile = useUserStore.getState().profile;

      if (!profile?.id) {
        console.warn('No user profile found');
        setItems([]);
        setLoading(false);
        return;
      }

      // Fetch cart items with product details
      const { data, error } = await supabase
        .from('cart_items')
        .select(
          `
          id,
          product_id,
          quantity,
          products:product_id (
            id,
            name,
            price,
            image_url,
            unit,
            vendor_id,
            profiles:vendor_id (full_name)
          )
        `
        )
        .eq('user_id', profile.id);

      if (error) {
        console.error('Error fetching cart items:', error);
        throw error;
      }

      setItems((data || []) as any);
    } catch (error) {
      console.error('Failed to load cart:', error);
      Alert.alert('Error', 'Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'WELCOME10') {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
      setPromoApplied(false);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(cartItemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId);

      if (error) throw error;

      // Update local state
      setItems(
        items.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      // Update local state
      setItems(items.filter((item) => item.id !== cartItemId));

      Alert.alert('Removed', 'Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    // TODO: Implement payment processing
    Alert.alert(
      'Checkout',
      `Process payment of ₦${total.toFixed(2)} via ${selectedPayment}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            // After successful payment:
            // 1. Create order(s) from cart items
            // 2. Clear cart
            // 3. Navigate to order confirmation
            Alert.alert('Success', 'Payment processing not yet implemented');
          },
        },
      ]
    );
  };

  const subtotal = items.reduce(
    (sum, item) => sum + (item.products?.price || 0) * item.quantity,
    0
  );
  const deliveryFee = 2.99;
  const serviceFee = 1.49;
  const discount = promoApplied ? subtotal * 0.1 : 0; // 10% discount
  const total = subtotal + deliveryFee + serviceFee - discount;

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={{
          ...styles.container,
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        <AppHeader title="Your Cart" />
        <View style={styles.emptyCart}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.emptySubtitle,
              { color: colors.textSecondary, marginTop: 16 },
            ]}
          >
            Loading your cart...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView
        edges={['top']}
        style={{
          ...styles.container,
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        <AppHeader title="Your Cart: Empty" />

        <View style={styles.emptyCart}>
          <ShoppingBag size={80} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your cart is empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add some fresh produce from local farmers
          </Text>
          <TouchableOpacity
            style={[styles.shopButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.shopButtonText, { color: colors.buttonText }]}>
              Start Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        ...styles.container,
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <AppHeader title={`Your Order: ${items.length} items`} />

      {/* Promo Code */}
      <View
        style={[
          styles.orderSummary,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.summaryTitle, { color: colors.text }]}>
          Promo Code
        </Text>
        <View style={styles.promoContainer}>
          <TextInput
            style={[
              styles.promoInput,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.filter,
              },
            ]}
            placeholder="Enter promo code"
            placeholderTextColor={colors.textSecondary}
            value={promoCode}
            onChangeText={setPromoCode}
          />
          <TouchableOpacity
            style={[
              styles.promoButton,
              { backgroundColor: colors.primary },
              promoApplied ? { backgroundColor: colors.success } : null,
            ]}
            onPress={handleApplyPromo}
            disabled={!promoCode}
          >
            <Text
              style={[styles.promoButtonText, { color: colors.buttonText }]}
            >
              {promoApplied ? 'Applied' : 'Apply'}
            </Text>
          </TouchableOpacity>
        </View>
        {promoError ? (
          <Text style={[styles.promoError, { color: colors.error }]}>
            {promoError}
          </Text>
        ) : promoApplied ? (
          <Text style={[styles.promoSuccess, { color: colors.success }]}>
            Promo code applied successfully!
          </Text>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.itemsList}>
        {/* Cart Items */}
        <View style={{ height: 10 }}/>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.cartItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Image
              source={{ uri: item.products?.image_url || '' }}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: colors.text }]}>
                {item.products?.name || 'Unknown Product'}
              </Text>
              <Text
                style={[styles.farmerName, { color: colors.textSecondary }]}
              >
                {item.products?.profiles?.full_name || 'Unknown Vendor'}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>
                ₦{(item.products?.price || 0).toFixed(2)} /{' '}
                {item.products?.unit || 'unit'}
              </Text>
            </View>
            <View
              style={[
                styles.quantityControls,
                { backgroundColor: colors.filter },
              ]}
            >
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <Minus size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.quantity, { color: colors.text }]}>
                {item.quantity}
              </Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Plus size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(item.id)}
            >
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Order Summary */}
        <View
          style={[
            styles.orderSummary,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Order Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Subtotal
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₦{subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Delivery Fee
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₦{deliveryFee.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Service Fee
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₦{serviceFee.toFixed(2)}
            </Text>
          </View>
          {promoApplied && (
            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colors.success, fontWeight: '700' },
                ]}
              >
                Discount (10%)
              </Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                -₦{discount.toFixed(2)}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.summaryRow,
              styles.totalRow,
              { borderTopColor: colors.border },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ₦{total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.orderSummary, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Payment Method
          </Text>

          <View style={styles.paymentOptions}>
            {[
              { label: 'Wallet', icon: 'wallet' },
              { label: 'Card', icon: 'credit-card' },
              { label: 'Transfer', icon: 'bank' },
            ].map((method) => (
              <TouchableOpacity
                key={method.label}
                style={[
                  styles.paymentOption,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.filter,
                  },
                  selectedPayment === method.label && {
                    borderColor: colors.primary,
                    backgroundColor: colors.card,
                  },
                ]}
                onPress={() => setSelectedPayment(method.label)}
              >
                <View style={styles.paymentLeft}>
                  <Ionicons
                    name={
                      method.label === 'Wallet'
                        ? 'wallet-outline'
                        : method.label === 'Card'
                        ? 'card-outline'
                        : 'swap-horizontal-outline'
                    }
                    size={20}
                    color={
                      selectedPayment === method.label
                        ? colors.primary
                        : colors.textSecondary
                    }
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.paymentLabel,
                      {
                        color:
                          selectedPayment === method.label
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {method.label}
                  </Text>
                </View>

                {selectedPayment === method.label && (
                  <CheckCircle size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Checkout Button */}
        <View
          style={[styles.checkoutSection, { backgroundColor: colors.card }]}
        >
          <TouchableOpacity
            style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
            onPress={handleCheckout}
          >
            <Text
              style={[styles.checkoutButtonText, { color: colors.buttonText }]}
            >
              Pay ₦{total.toFixed(2)}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.checkoutNote, { color: colors.textSecondary }]}>
            Estimated delivery: Tomorrow, 10:00 AM - 2:00 PM
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  itemCount: {
    fontSize: 16,
    marginTop: 4,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 12,
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
  },
  removeButton: {
    padding: 8,
  },
  orderSummary: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutSection: {
    padding: 20,
  },
  checkoutButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutNote: {
    fontSize: 14,
    textAlign: 'center',
  },
  paymentOptions: {
    marginTop: 10,
    gap: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentLabel: {
    fontSize: 16,
  },

  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  promoButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 10,
  },
  promoButtonText: {
    fontWeight: '700',
  },
  promoError: {
    marginTop: 8,
    fontSize: 14,
  },
  promoSuccess: {
    marginTop: 8,
    fontSize: 14,
  },
});
