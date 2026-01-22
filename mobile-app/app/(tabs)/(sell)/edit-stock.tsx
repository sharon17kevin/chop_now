import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import AppHeader from '@/components/AppHeader';
import { Save, Plus, Minus, DollarSign, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  unit: string;
  is_available: boolean;
  image_url: string;
  discount_percentage: number | null;
  original_price: number | null;
  is_on_sale: boolean | null;
  sale_ends_at: string | null;
}

export default function EditStockScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { productId } = useLocalSearchParams();

  const [stockAdjustment, setStockAdjustment] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [hasPromotion, setHasPromotion] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [saleEndDate, setSaleEndDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasExpiry, setHasExpiry] = useState(true);

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product-details', productId],
    queryFn: async () => {
      if (!productId) throw new Error('No product ID');

      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name, category, stock, price, unit, is_available, image_url, discount_percentage, original_price, is_on_sale, sale_ends_at',
        )
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });

  // Initialize promotion state when product loads
  useEffect(() => {
    if (product) {
      setHasPromotion(!!product.discount_percentage);
      setDiscountPercentage(product.discount_percentage?.toString() || '');
      setNewPrice(product.price.toString());

      // Set expiry date if exists
      if (product.sale_ends_at) {
        setSaleEndDate(new Date(product.sale_ends_at));
        setHasExpiry(true);
      } else {
        setSaleEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setHasExpiry(product.discount_percentage ? false : true);
      }
    }
  }, [product]);

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async (newStock: number) => {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-stock'] });
      queryClient.invalidateQueries({
        queryKey: ['product-details', productId],
      });
      setStockAdjustment('');
      Alert.alert('Success', 'Stock updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update stock');
    },
  });

  // Update promotion mutation
  const updatePromotionMutation = useMutation({
    mutationFn: async ({
      discount,
      currentPrice,
    }: {
      discount: number | null;
      currentPrice: number;
    }) => {
      let updateData: any = {
        discount_percentage: discount,
        is_on_sale: discount !== null,
        updated_at: new Date().toISOString(),
      };

      if (discount !== null) {
        // Adding/updating promotion
        // Save original price if not already set, or use current product.original_price
        const originalPrice = product?.original_price || currentPrice;
        // Calculate discounted price
        const discountedPrice = originalPrice * (1 - discount / 100);

        updateData.original_price = originalPrice;
        updateData.price = discountedPrice;
        updateData.sale_ends_at = hasExpiry ? saleEndDate.toISOString() : null;
      } else {
        // Removing promotion - restore original price
        if (product?.original_price) {
          updateData.price = product.original_price;
        }
        updateData.original_price = null;
        updateData.sale_ends_at = null;
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-stock'] });
      queryClient.invalidateQueries({
        queryKey: ['product-details', productId],
      });
      Alert.alert('Success', 'Promotion updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update promotion');
    },
  });

  // Update price mutation
  const updatePriceMutation = useMutation({
    mutationFn: async (price: number) => {
      const { error } = await supabase
        .from('products')
        .update({ price, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-stock'] });
      queryClient.invalidateQueries({
        queryKey: ['product-details', productId],
      });
      Alert.alert('Success', 'Price updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update price');
    },
  });

  const handleQuickAdjust = (delta: number) => {
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    updateStockMutation.mutate(newStock);
  };

  const handleManualUpdate = () => {
    if (!product) return;

    const adjustment = parseInt(stockAdjustment);
    if (isNaN(adjustment)) {
      Alert.alert('Invalid Input', 'Please enter a valid number');
      return;
    }

    const newStock = Math.max(0, product.stock + adjustment);
    updateStockMutation.mutate(newStock);
  };

  const handleSavePromotion = async () => {
    if (!product) return;

    if (hasPromotion) {
      const discount = parseFloat(discountPercentage);
      if (isNaN(discount) || discount <= 0 || discount >= 100) {
        Alert.alert(
          'Invalid Discount',
          'Please enter a discount between 1 and 99',
        );
        return;
      }
      // Use original_price if it exists (updating existing promo), otherwise use current price
      const basePrice = product.original_price || product.price;
      await updatePromotionMutation.mutateAsync({
        discount,
        currentPrice: basePrice,
      });
    } else {
      // Remove promotion
      await updatePromotionMutation.mutateAsync({
        discount: null,
        currentPrice: product.price,
      });
    }
  };

  const handleUpdatePrice = () => {
    if (!product) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0');
      return;
    }

    updatePriceMutation.mutate(price);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSaleEndDate(selectedDate);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <AppHeader title="Edit Stock" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <AppHeader title="Edit Stock" />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Failed to load product details
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <AppHeader title="Edit Stock" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
          >
            {/* Product Info */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.productName, { color: colors.text }]}>
                {product.name}
              </Text>
              <Text
                style={[
                  styles.productCategory,
                  { color: colors.textSecondary },
                ]}
              >
                {product.category} • ₦{product.price.toLocaleString()}/
                {product.unit}
              </Text>
              <Text style={[styles.currentStock, { color: colors.text }]}>
                Current Stock:{' '}
                <Text style={styles.stockValue}>{product.stock}</Text>{' '}
                {product.unit}
              </Text>
            </View>

            {/* Quick Adjust */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Quick Adjust
              </Text>
              <View style={styles.quickAdjustRow}>
                <TouchableOpacity
                  style={[
                    styles.quickButton,
                    { backgroundColor: colors.error },
                  ]}
                  onPress={() => handleQuickAdjust(-10)}
                  disabled={
                    product.stock === 0 || updateStockMutation.isPending
                  }
                >
                  <Text style={styles.quickButtonText}>-10</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickButton,
                    { backgroundColor: colors.error },
                  ]}
                  onPress={() => handleQuickAdjust(-1)}
                  disabled={
                    product.stock === 0 || updateStockMutation.isPending
                  }
                >
                  <Minus size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickButton,
                    { backgroundColor: colors.success },
                  ]}
                  onPress={() => handleQuickAdjust(1)}
                  disabled={updateStockMutation.isPending}
                >
                  <Plus size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickButton,
                    { backgroundColor: colors.success },
                  ]}
                  onPress={() => handleQuickAdjust(10)}
                  disabled={updateStockMutation.isPending}
                >
                  <Text style={styles.quickButtonText}>+10</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Manual Adjustment */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Manual Adjustment
              </Text>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Add/Remove Stock
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.filter,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. +50 or -10"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={stockAdjustment}
                onChangeText={setStockAdjustment}
                returnKeyType="done"
                onSubmitEditing={handleManualUpdate}
              />
              {stockAdjustment && (
                <Text style={[styles.preview, { color: colors.textSecondary }]}>
                  New Stock:{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    {Math.max(
                      0,
                      product.stock + (parseInt(stockAdjustment) || 0),
                    )}{' '}
                    {product.unit}
                  </Text>
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.secondary,
                    opacity: updateStockMutation.isPending ? 0.6 : 1,
                  },
                ]}
                onPress={handleManualUpdate}
                disabled={updateStockMutation.isPending}
              >
                {updateStockMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Save size={20} color="#fff" />
                    <Text style={styles.buttonText}>Update Stock</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Price Section */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Update Price
              </Text>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Price per {product.unit}
              </Text>
              <View
                style={[
                  styles.priceInputContainer,
                  {
                    backgroundColor: colors.filter,
                    borderColor: colors.border,
                  },
                ]}
              >
                <DollarSign size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.priceInput, { color: colors.text }]}
                  placeholder={product.price.toString()}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={newPrice}
                  onChangeText={setNewPrice}
                  returnKeyType="done"
                  onSubmitEditing={handleUpdatePrice}
                />
              </View>
              {newPrice && parseFloat(newPrice) !== product.price && (
                <Text style={[styles.preview, { color: colors.textSecondary }]}>
                  New Price:{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    ₦{parseFloat(newPrice || '0').toLocaleString()}/
                    {product.unit}
                  </Text>
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    opacity: updatePriceMutation.isPending ? 0.6 : 1,
                    marginTop: 12,
                  },
                ]}
                onPress={handleUpdatePrice}
                disabled={updatePriceMutation.isPending}
              >
                {updatePriceMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Save size={20} color="#fff" />
                    <Text style={styles.buttonText}>Update Price</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Promotion Section */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.promotionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Hot Deal Promotion
                </Text>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    {
                      backgroundColor: hasPromotion
                        ? colors.success
                        : colors.border,
                    },
                  ]}
                  onPress={() => setHasPromotion(!hasPromotion)}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      { backgroundColor: colors.card },
                      hasPromotion && styles.toggleCircleActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {hasPromotion && (
                <View>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Discount Percentage
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.filter,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="e.g. 15"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={discountPercentage}
                    onChangeText={setDiscountPercentage}
                    returnKeyType="done"
                    onSubmitEditing={handleSavePromotion}
                  />

                  {/* Expiry Date Section */}
                  <View style={{ marginTop: 16 }}>
                    <View style={styles.promotionHeader}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>
                        Set Expiry Date
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.toggleSwitch,
                          {
                            backgroundColor: hasExpiry
                              ? colors.success
                              : colors.border,
                          },
                        ]}
                        onPress={() => setHasExpiry(!hasExpiry)}
                      >
                        <View
                          style={[
                            styles.toggleCircle,
                            { backgroundColor: colors.card },
                            hasExpiry && styles.toggleCircleActive,
                          ]}
                        />
                      </TouchableOpacity>
                    </View>

                    {hasExpiry && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.filter,
                              borderColor: colors.border,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingHorizontal: 16,
                            },
                          ]}
                          onPress={() => setShowDatePicker(true)}
                        >
                          <Text style={{ color: colors.text }}>
                            {saleEndDate.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                          <Calendar size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {showDatePicker && (
                          <DateTimePicker
                            value={saleEndDate}
                            mode="date"
                            display={
                              Platform.OS === 'ios' ? 'spinner' : 'default'
                            }
                            onChange={handleDateChange}
                            minimumDate={new Date()}
                          />
                        )}

                        <Text
                          style={[
                            styles.preview,
                            { color: colors.textSecondary, marginTop: 8 },
                          ]}
                        >
                          Sale ends:{' '}
                          <Text
                            style={{ color: colors.warning, fontWeight: '600' }}
                          >
                            {saleEndDate.toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                        </Text>
                      </>
                    )}
                  </View>

                  {discountPercentage && (
                    <Text
                      style={[styles.preview, { color: colors.textSecondary }]}
                    >
                      Sale Price:{' '}
                      <Text
                        style={{ color: colors.success, fontWeight: '700' }}
                      >
                        ₦
                        {(
                          (product.original_price || product.price) *
                          (1 - parseFloat(discountPercentage || '0') / 100)
                        ).toFixed(2)}
                        /{product.unit}
                      </Text>
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.success,
                    marginTop: 12,
                  },
                ]}
                onPress={handleSavePromotion}
                disabled={updatePromotionMutation.isPending}
              >
                {updatePromotionMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    {hasPromotion ? 'Save Promotion' : 'Remove Promotion'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    marginBottom: 12,
  },
  currentStock: {
    fontSize: 16,
    fontWeight: '500',
  },
  stockValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  preview: {
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleCircleActive: {
    transform: [{ translateX: 22 }],
  },
  errorText: {
    fontSize: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
});
