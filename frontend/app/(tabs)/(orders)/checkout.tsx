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
          <ShoppingBag size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some fresh produce from local farmers
          </Text>
          <TouchableOpacity style={styles.shopButton}>
            <Text style={styles.shopButtonText}>Start Shopping</Text>
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
      <View style={styles.orderSummary}>
        <Text style={styles.summaryTitle}>Promo Code</Text>
        <View style={styles.promoContainer}>
          <TextInput
            style={styles.promoInput}
            placeholder="Enter promo code"
            placeholderTextColor="#999"
            value={promoCode}
            onChangeText={setPromoCode}
          />
          <TouchableOpacity
            style={[
              styles.promoButton,
              promoApplied ? styles.promoApplied : null,
            ]}
            onPress={handleApplyPromo}
            disabled={!promoCode}
          >
            <Text style={styles.promoButtonText}>
              {promoApplied ? 'Applied' : 'Apply'}
            </Text>
          </TouchableOpacity>
        </View>
        {promoError ? (
          <Text style={styles.promoError}>{promoError}</Text>
        ) : promoApplied ? (
          <Text style={styles.promoSuccess}>
            Promo code applied successfully!
          </Text>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.itemsList}>
        {items.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.farmerName}>{item.farmer}</Text>
              <Text style={styles.itemPrice}>
                ${item.price.toFixed(2)} {item.unit}
              </Text>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <Minus size={16} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Plus size={16} color="#6B7280" />
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
        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>${serviceFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Payment Method</Text>

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
                  selectedPayment === method.label &&
                    styles.paymentOptionActive,
                ]}
                onPress={() => setSelectedPayment(method.label)}
              >
                <View style={styles.paymentLeft}>
                  <Wallet
                    size={20}
                    color={
                      selectedPayment === method.label ? '#f6891f' : '#888'
                    }
                  />
                  <Text
                    style={[
                      styles.paymentLabel,
                      selectedPayment === method.label && { color: '#f6891f' },
                    ]}
                  >
                    {method.label}
                  </Text>
                </View>

                {selectedPayment === method.label && (
                  <CheckCircle size={20} color="#f6891f" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Checkout Button */}
        <View style={styles.checkoutSection}>
          <TouchableOpacity style={styles.checkoutButton}>
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
          <Text style={styles.checkoutNote}>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  itemCount: {
    fontSize: 16,
    color: '#6B7280',
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
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 12,
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 16,
  },
  removeButton: {
    padding: 8,
  },
  orderSummary: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  checkoutSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  checkoutButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutNote: {
    fontSize: 14,
    color: '#6B7280',
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
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  paymentOptionActive: {
    borderColor: '#f6891f',
    backgroundColor: '#fff5ed',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#333',
  },

  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
  },
  promoButton: {
    backgroundColor: '#f6891f',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 10,
  },
  promoApplied: {
    backgroundColor: '#4CAF50',
  },
  promoButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  promoError: {
    color: '#e53935',
    marginTop: 8,
    fontSize: 14,
  },
  promoSuccess: {
    color: '#4CAF50',
    marginTop: 8,
    fontSize: 14,
  },
});
