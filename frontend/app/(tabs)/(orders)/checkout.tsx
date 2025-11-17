import AppHeader from '@/components/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import {
  CheckCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const cartItems = [
  {
    id: 1,
    name: 'Organic Tomatoes',
    price: 4.99,
    quantity: 2,
    unit: 'per lb',
    farmer: 'Green Valley Farm',
    image:
      'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    name: 'Fresh Strawberries',
    price: 6.99,
    quantity: 1,
    unit: 'per basket',
    farmer: 'Berry Fields',
    image:
      'https://images.pexels.com/photos/46174/strawberries-berries-fruit-freshness-46174.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 3,
    name: 'Farm Fresh Eggs',
    price: 5.49,
    quantity: 3,
    unit: 'per dozen',
    farmer: 'Sunny Side Farm',
    image:
      'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export default function CartScreen() {
  const [items, setItems] = useState(cartItems);
  const { colors } = useTheme();
  const [selectedPayment, setSelectedPayment] = useState('Wallet');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = () => {
    if (promoCode.trim().toLowerCase() === 'WELCOME10') {
      setPromoApplied(true);
      setPromoError('');
      // Apply discount logic here
    } else {
      setPromoError('Invalid promo code');
      setPromoApplied(false);
    }
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setItems(items.filter((item) => item.id !== id));
    } else {
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 2.99;
  const serviceFee = 1.49;
  const total = subtotal + deliveryFee + serviceFee;

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
        <AppHeader title={`Your Order: Empty`} />

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
      <View style={[styles.orderSummary, { backgroundColor: colors.card }]}>
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
              promoApplied ? { backgroundColor: '#10B981' } : null,
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
          <Text style={[styles.promoError, { color: '#e53935' }]}>
            {promoError}
          </Text>
        ) : promoApplied ? (
          <Text style={[styles.promoSuccess, { color: '#4CAF50' }]}>
            Promo code applied successfully!
          </Text>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.itemsList}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[styles.cartItem, { backgroundColor: colors.card }]}
          >
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text
                style={[styles.farmerName, { color: colors.textSecondary }]}
              >
                {item.farmer}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>
                ${item.price.toFixed(2)} {item.unit}
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
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Order Summary */}
        <View style={[styles.orderSummary, { backgroundColor: colors.card }]}>
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
              ${subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Delivery Fee
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${deliveryFee.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Service Fee
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${serviceFee.toFixed(2)}
            </Text>
          </View>
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
              ${total.toFixed(2)}
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
          >
            <Text
              style={[styles.checkoutButtonText, { color: colors.buttonText }]}
            >
              Pay
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
