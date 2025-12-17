import AppHeader from '@/components/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/stores/useUserStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
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
  const [selectedPayment, setSelectedPayment] = useState('Card');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [processing, setProcessing] = useState(false);

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

    if (selectedPayment === 'Wallet') {
      Alert.alert(
        'Coming Soon',
        'Wallet payment will be available soon. Please use Card or Transfer for now.'
      );
      return;
    }

    try {
      setProcessing(true);

      const profile = useUserStore.getState().profile;
      if (!profile?.id || !profile?.email) {
        Alert.alert('Error', 'Please login to continue');
        return;
      }

      // Generate unique reference
      const reference = `order_${Date.now()}_${profile.id.slice(0, 8)}`;

      // Prepare order metadata
      const orderMetadata = {
        user_id: profile.id,
        order_type: 'product_purchase',
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.products?.name,
          quantity: item.quantity,
          price: item.products?.price,
          vendor_id: item.products?.vendor_id,
          vendor_name: item.products?.profiles?.full_name,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        discount,
        total,
        promo_code: promoApplied ? promoCode : null,
      };

      // Initialize Paystack payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'paystack-initialize',
        {
          body: {
            email: profile.email,
            amount: Math.round(total * 100), // Convert to kobo
            reference,
            channels: selectedPayment === 'Card' ? ['card'] : ['bank', 'bank_transfer'],
            metadata: orderMetadata,
          },
        }
      );

      if (paymentError) throw paymentError;

      if (!paymentData?.data?.authorization_url) {
        throw new Error('Failed to initialize payment');
      }

      // Open Paystack payment page
      const result = await WebBrowser.openAuthSessionAsync(
        paymentData.data.authorization_url,
        'your-app-scheme://'
      );

      // After payment window closes, verify payment
      if (result.type === 'cancel' || result.type === 'dismiss') {
        Alert.alert(
          'Payment Cancelled',
          'Would you like to verify if payment was completed?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Verify',
              onPress: () => verifyAndCreateOrder(reference, orderMetadata),
            },
          ]
        );
        return;
      }

      // Verify payment
      await verifyAndCreateOrder(reference, orderMetadata);
    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Payment Failed', error.message || 'Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  const verifyAndCreateOrder = async (reference: string, orderMetadata: any) => {
    try {
      setProcessing(true);

      // Verify payment
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'paystack-verify',
        {
          body: { reference },
        }
      );

      if (verifyError) throw verifyError;

      if (verifyData?.data?.status === 'success') {
        // Create orders (group by vendor)
        const vendorGroups = items.reduce((acc, item) => {
          const vendorId = item.products?.vendor_id;
          if (!vendorId) return acc;
          
          if (!acc[vendorId]) {
            acc[vendorId] = [];
          }
          acc[vendorId].push(item);
          return acc;
        }, {} as Record<string, CartItem[]>);

        const profile = useUserStore.getState().profile;

        // Create order for each vendor
        for (const [vendorId, vendorItems] of Object.entries(vendorGroups)) {
          const orderTotal = vendorItems.reduce(
            (sum, item) => sum + (item.products?.price || 0) * item.quantity,
            0
          );

          await supabase.from('orders').insert({
            user_id: profile?.id,
            vendor_id: vendorId,
            items: vendorItems.map((item) => ({
              product_id: item.product_id,
              product_name: item.products?.name,
              quantity: item.quantity,
              price: item.products?.price,
              unit: item.products?.unit,
            })),
            total: orderTotal,
            payment_reference: reference,
            payment_method: selectedPayment.toLowerCase(),
            payment_status: 'paid',
            status: 'pending',
            metadata: orderMetadata,
          });
        }

        // Clear cart
        const { error: clearError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', profile?.id);

        if (clearError) console.error('Failed to clear cart:', clearError);

        // Show success and navigate
        Alert.alert(
          'Order Placed!',
          'Your payment was successful. Vendors will start preparing your order.',
          [
            {
              text: 'View Orders',
              onPress: () => router.push('/(tabs)/(orders)'),
            },
          ]
        );

        // Refresh cart
        setItems([]);
      } else {
        Alert.alert('Payment Failed', 'Payment verification failed. Please contact support.');
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      Alert.alert('Error', 'Payment succeeded but order creation failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
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
              { label: 'Card', icon: 'card-outline', enabled: true },
              { label: 'Transfer', icon: 'swap-horizontal-outline', enabled: true },
              { label: 'Wallet', icon: 'wallet-outline', enabled: false },
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
                  !method.enabled && { opacity: 0.5 },
                ]}
                onPress={() => method.enabled && setSelectedPayment(method.label)}
                disabled={!method.enabled}
              >
                <View style={styles.paymentLeft}>
                  <Ionicons
                    name={method.icon as any}
                    size={20}
                    color={
                      selectedPayment === method.label
                        ? colors.primary
                        : colors.textSecondary
                    }
                    style={{ marginRight: 8 }}
                  />
                  <View>
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
                    {!method.enabled && (
                      <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
                        Coming Soon
                      </Text>
                    )}
                  </View>
                </View>

                {selectedPayment === method.label && method.enabled && (
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
            style={[
              styles.checkoutButton,
              { backgroundColor: colors.primary },
              processing && { opacity: 0.6 },
            ]}
            onPress={handleCheckout}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text
                style={[styles.checkoutButtonText, { color: colors.buttonText }]}
              >
                Pay ₦{total.toFixed(2)} via {selectedPayment}
              </Text>
            )}
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
  comingSoonText: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
