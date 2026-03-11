// app/(tabs)/(home)/vendor/[vendorId].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Star,
  Package,
  X,
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  Tag,
  Percent,
  Phone,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useVendorProducts } from '@/hooks/useVendorProducts';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import ProductCard from '@/components/ProductCard';
import { CartService } from '@/services/cart';
import { useUserStore } from '@/stores/useUserStore';
import { useWishlist } from '@/hooks/useWishlist';
import { isDiscountActive } from '@/stores/useProductStore';
import {
  calculateOrderTotal,
  getNextDiscountTier,
  formatDiscountTier,
} from '@/utils/pricing';

export default function VendorPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { vendorId, vendorName, vendorAddress, vendorRating, productId } =
    useLocalSearchParams();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Product detail view
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Fetch vendor profile for contact info
  const { profile: vendorProfile } = useVendorProfile(vendorId as string);

  const {
    categories,
    productsByCategory,
    loading,
    error,
    refreshing,
    handleRefresh,
  } = useVendorProducts(vendorId as string);

  const currentProducts = productsByCategory[selectedCategory] || [];

  // Calculate pricing with bulk discounts
  const pricingInfo = selectedProduct
    ? calculateOrderTotal(
        selectedProduct.price,
        selectedProduct.bulk_discount_tiers,
        quantity,
      )
    : null;

  // Get next discount tier for incentive
  const nextTier = selectedProduct
    ? getNextDiscountTier(selectedProduct.bulk_discount_tiers, quantity)
    : null;

  // Auto-open product if navigated with productId
  useEffect(() => {
    if (productId && !loading) {
      // Find the product across all categories
      let foundProduct = null;
      for (const category in productsByCategory) {
        foundProduct = productsByCategory[category].find(
          (p: any) => p.id === productId,
        );
        if (foundProduct) {
          setSelectedCategory(category);
          setSelectedProduct(foundProduct);
          const minQty = foundProduct.minimum_order_quantity || 1;
          setQuantity(minQty);
          break;
        }
      }
    }
  }, [productId, loading, productsByCategory]);

  // Handle product card press
  const handleProductPress = (product: any) => {
    const minQty = product.minimum_order_quantity || 1;
    setSelectedProduct(product);
    setQuantity(minQty);
  };

  // Close product detail view
  const handleCloseDetail = () => {
    setSelectedProduct(null);
    const minQty = selectedProduct?.minimum_order_quantity || 1;
    setQuantity(minQty);
  };

  // Handle category tab press - closes detail view
  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setSelectedProduct(null); // Return to product grid
  };

  // Quantity controls
  const increment = () => {
    if (selectedProduct && quantity < selectedProduct.stock) {
      const incrementValue = selectedProduct.order_increment || 1;
      const newQuantity = quantity + incrementValue;
      // Don't exceed stock
      setQuantity(Math.min(newQuantity, selectedProduct.stock));
    }
  };

  const decrement = () => {
    const minQty = selectedProduct?.minimum_order_quantity || 1;
    const incrementValue = selectedProduct?.order_increment || 1;
    if (quantity > minQty) {
      const newQuantity = quantity - incrementValue;
      // Don't go below minimum order quantity
      setQuantity(Math.max(newQuantity, minQty));
    }
  };

  // Vendor contact functions
  const handleCallVendor = () => {
    if (!vendorProfile?.business_phone && !vendorProfile?.phone) {
      Alert.alert('No Contact', 'Vendor contact number not available');
      return;
    }

    const phoneNumber = vendorProfile.business_phone || vendorProfile.phone;

    Alert.alert('Contact Vendor', `Call ${vendorName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call',
        onPress: () => {
          Linking.openURL(`tel:${phoneNumber}`);
        },
      },
    ]);
  };

  const handleCopyVendorNumber = async () => {
    if (!vendorProfile?.business_phone && !vendorProfile?.phone) {
      Alert.alert('No Contact', 'Vendor contact number not available');
      return;
    }

    const phoneNumber = vendorProfile.business_phone || vendorProfile.phone;
    if (phoneNumber) {
      await Clipboard.setStringAsync(phoneNumber);
      Alert.alert('Copied', 'Vendor phone number copied to clipboard');
    }
  };

  // Toggle wishlist
  const handleWishlistToggle = async () => {
    if (!selectedProduct) return;
    await toggleWishlist(selectedProduct.id);
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    const minQty = selectedProduct.minimum_order_quantity || 1;

    // Validate minimum order quantity
    if (quantity < minQty) {
      Alert.alert(
        'Minimum Order Quantity',
        `This product requires a minimum order of ${minQty} ${selectedProduct.unit}(s).`,
        [{ text: 'OK' }],
      );
      return;
    }

    try {
      setAddingToCart(true);
      const userId = useUserStore.getState().profile?.id;

      if (!userId) {
        alert('Please log in to add items to cart');
        return;
      }

      // Check if already in cart
      const existing = await CartService.getExistingCartItem(
        userId,
        selectedProduct.id,
      );

      if (existing) {
        // Update quantity
        await CartService.updateQuantity(
          existing.id,
          existing.quantity + quantity,
        );
      } else {
        // Add new item
        await CartService.addItem(userId, selectedProduct.id, quantity);
      }

      alert(`Added ${quantity} ${selectedProduct.name} to cart!`);
      handleCloseDetail();
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.filter }]}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() =>
            router.push({
              pathname: '/vendor/vendorInfo',
              params: { vendorId, vendorName, vendorAddress, vendorRating },
            })
          }
          activeOpacity={0.7}
        >
          <Text style={[styles.vendorName, { color: colors.text }]}>
            {vendorName || 'Vendor'}
          </Text>
          <View style={styles.vendorMeta}>
            {vendorAddress && (
              <View style={styles.metaItem}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  {vendorAddress}
                </Text>
              </View>
            )}
            {vendorRating && (
              <View style={styles.metaItem}>
                <Star size={14} color={colors.primary} fill={colors.primary} />
                <Text style={[styles.metaText, { color: colors.text }]}>
                  {vendorRating}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Vendor Contact Button */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Contact Vendor',
              `Choose an option to contact ${vendorName || 'vendor'}`,
              [
                {
                  text: 'Call',
                  onPress: handleCallVendor,
                },
                {
                  text: 'Copy Number',
                  onPress: handleCopyVendorNumber,
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
              ],
            );
          }}
          style={[styles.contactButton, { backgroundColor: colors.filter }]}
        >
          <Phone size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => handleCategoryPress(category)}
              style={[
                styles.tab,
                { backgroundColor: colors.filter },
                selectedCategory === category && {
                  backgroundColor: colors.secondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary },
                  selectedCategory === category && {
                    color: colors.buttonText,
                    fontWeight: '700',
                  },
                ]}
              >
                {category}
              </Text>
              {productsByCategory[category] && (
                <Text
                  style={[
                    styles.tabCount,
                    { color: colors.textTetiary },
                    selectedCategory === category && {
                      color: colors.buttonText,
                    },
                  ]}
                >
                  {productsByCategory[category].length}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Error Banner */}
      {error && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.errorBackground,
              borderColor: colors.error,
            },
          ]}
        >
          <Text style={{ color: colors.error, fontWeight: '600' }}>
            {error}
          </Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CONDITIONAL RENDER: Product Detail OR Product Grid */}
      {selectedProduct ? (
        // PRODUCT DETAIL VIEW
        <ScrollView
          style={styles.detailContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={handleCloseDetail}
            style={[styles.closeButton, { backgroundColor: colors.filter }]}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Wishlist Button */}
          <TouchableOpacity
            onPress={handleWishlistToggle}
            style={[styles.wishlistButton, { backgroundColor: colors.card }]}
          >
            <Heart
              size={24}
              color={
                isInWishlist(selectedProduct.id)
                  ? colors.error
                  : colors.textSecondary
              }
              fill={
                isInWishlist(selectedProduct.id) ? colors.error : 'transparent'
              }
            />
          </TouchableOpacity>

          {/* Product Image */}
          <Image
            source={{ uri: selectedProduct.image_url }}
            style={styles.detailImage}
            resizeMode="cover"
          />

          {/* Product Info */}
          <View style={styles.detailInfo}>
            <Text
              style={[styles.detailCategory, { color: colors.textSecondary }]}
            >
              {selectedProduct.category}
            </Text>

            <Text style={[styles.detailName, { color: colors.text }]}>
              {selectedProduct.name}
            </Text>

            <Text
              style={[
                styles.detailDescription,
                { color: colors.textSecondary },
              ]}
            >
              {selectedProduct.description}
            </Text>

            {/* Out of Stock Banner */}
            {selectedProduct.stock === 0 && (
              <View
                style={[
                  styles.promoBanner,
                  {
                    backgroundColor: colors.error + '15',
                    borderColor: colors.error,
                  },
                ]}
              >
                <View
                  style={[
                    styles.promoIcon,
                    { backgroundColor: colors.error + '20' },
                  ]}
                >
                  <Package size={20} color={colors.error} />
                </View>
                <View style={styles.promoContent}>
                  <Text style={[styles.promoTitle, { color: colors.error }]}>
                    Out of Stock
                  </Text>
                  <Text style={[styles.promoText, { color: colors.text }]}>
                    This product is currently unavailable. Check back later.
                  </Text>
                </View>
              </View>
            )}

            {/* Promo/Discount Banner - only show if discount is active */}
            {isDiscountActive(selectedProduct) && (
              <View
                style={[
                  styles.promoBanner,
                  {
                    backgroundColor: colors.success + '15',
                    borderColor: colors.success,
                  },
                ]}
              >
                <View style={styles.promoIcon}>
                  <Tag size={20} color={colors.success} />
                </View>
                <View style={styles.promoContent}>
                  <View style={styles.promoHeader}>
                    <Text
                      style={[styles.promoTitle, { color: colors.success }]}
                    >
                      {selectedProduct.discount_percentage}% OFF
                    </Text>
                    {selectedProduct.sale_ends_at && (
                      <Text
                        style={[
                          styles.promoExpiry,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Ends{' '}
                        {new Date(
                          selectedProduct.sale_ends_at,
                        ).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.promoText, { color: colors.text }]}>
                    Save ₦
                    {selectedProduct.original_price
                      ? (
                          selectedProduct.original_price - selectedProduct.price
                        ).toLocaleString()
                      : (
                          (selectedProduct.price *
                            selectedProduct.discount_percentage) /
                          100
                        ).toLocaleString()}{' '}
                    on this item!
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.priceRow}>
              <View>
                {isDiscountActive(selectedProduct) ? (
                  <>
                    <View style={styles.discountPriceRow}>
                      <Text
                        style={[styles.detailPrice, { color: colors.primary }]}
                      >
                        ₦{selectedProduct.price.toLocaleString()}
                      </Text>
                      <View
                        style={[
                          styles.percentBadge,
                          { backgroundColor: colors.error },
                        ]}
                      >
                        <Percent size={10} color="#fff" />
                        <Text style={styles.percentText}>
                          {selectedProduct.discount_percentage}
                        </Text>
                      </View>
                    </View>
                    {selectedProduct.original_price && (
                      <Text
                        style={[
                          styles.originalPrice,
                          { color: colors.textTetiary },
                        ]}
                      >
                        ₦{selectedProduct.original_price.toLocaleString()}
                      </Text>
                    )}
                    <Text
                      style={[styles.detailUnit, { color: colors.textTetiary }]}
                    >
                      per {selectedProduct.unit}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={[styles.detailPrice, { color: colors.primary }]}
                    >
                      ₦{selectedProduct.price.toLocaleString()}
                    </Text>
                    <Text
                      style={[styles.detailUnit, { color: colors.textTetiary }]}
                    >
                      per {selectedProduct.unit}
                    </Text>
                  </>
                )}
              </View>

              <View
                style={[
                  styles.stockBadge,
                  {
                    backgroundColor:
                      selectedProduct.stock > 10
                        ? colors.success
                        : selectedProduct.stock > 0
                          ? colors.warning
                          : colors.error,
                  },
                ]}
              >
                <Text style={styles.stockText}>
                  {selectedProduct.stock > 0
                    ? `${selectedProduct.stock} in stock`
                    : 'Out of stock'}
                </Text>
              </View>
            </View>

            {/* Bulk Discount Information */}
            {selectedProduct?.bulk_discount_tiers &&
              selectedProduct.bulk_discount_tiers.length > 0 && (
                <View style={styles.bulkDiscountSection}>
                  {/* Active discount badge */}
                  {pricingInfo && pricingInfo.discountPercent > 0 && (
                    <View
                      style={[
                        styles.activeDiscountBadge,
                        {
                          backgroundColor: colors.warning + '20',
                          borderColor: colors.warning,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeDiscountText,
                          { color: colors.warning },
                        ]}
                      >
                        🎉 {pricingInfo.discountPercent}% bulk discount applied!
                      </Text>
                    </View>
                  )}

                  {/* Discount tiers list */}
                  <View style={styles.discountTiersContainer}>
                    <Text
                      style={[
                        styles.discountTiersTitle,
                        { color: colors.text },
                      ]}
                    >
                      Bulk Pricing:
                    </Text>
                    {selectedProduct.bulk_discount_tiers.map(
                      (
                        tier: {
                          min_quantity: number;
                          discount_percent: number;
                        },
                        index: number,
                      ) => (
                        <View
                          key={index}
                          style={[
                            styles.discountTierItem,
                            {
                              backgroundColor:
                                pricingInfo?.discountPercent ===
                                tier.discount_percent
                                  ? colors.warning + '15'
                                  : colors.input,
                              borderColor:
                                pricingInfo?.discountPercent ===
                                tier.discount_percent
                                  ? colors.warning
                                  : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.discountTierText,
                              {
                                color:
                                  pricingInfo?.discountPercent ===
                                  tier.discount_percent
                                    ? colors.warning
                                    : colors.textSecondary,
                              },
                            ]}
                          >
                            {formatDiscountTier(tier, selectedProduct.unit)}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>

                  {/* Next tier incentive */}
                  {nextTier && (
                    <View
                      style={[
                        styles.nextTierBadge,
                        {
                          backgroundColor: colors.primary + '15',
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.nextTierText, { color: colors.primary }]}
                      >
                        💡 Add {nextTier.unitsToGo} more {selectedProduct.unit}{' '}
                        to unlock {nextTier.discount_percent}% off!
                      </Text>
                    </View>
                  )}

                  {/* Price breakdown */}
                  {pricingInfo && pricingInfo.discountPercent > 0 && (
                    <View style={styles.priceBreakdown}>
                      <View style={styles.priceBreakdownRow}>
                        <Text
                          style={[
                            styles.priceBreakdownLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Subtotal:
                        </Text>
                        <Text
                          style={[
                            styles.priceBreakdownValue,
                            { color: colors.textSecondary },
                          ]}
                        >
                          ₦{pricingInfo.subtotal.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.priceBreakdownRow}>
                        <Text
                          style={[
                            styles.priceBreakdownLabel,
                            { color: colors.success },
                          ]}
                        >
                          Bulk Discount ({pricingInfo.discountPercent}%):
                        </Text>
                        <Text
                          style={[
                            styles.priceBreakdownValue,
                            { color: colors.success },
                          ]}
                        >
                          -₦{pricingInfo.savings.toLocaleString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.priceBreakdownRow,
                          styles.totalRow,
                          { borderTopColor: colors.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priceBreakdownLabel,
                            styles.totalLabel,
                            { color: colors.text },
                          ]}
                        >
                          Total:
                        </Text>
                        <Text
                          style={[
                            styles.priceBreakdownValue,
                            styles.totalValue,
                            { color: colors.primary },
                          ]}
                        >
                          ₦{pricingInfo.total.toLocaleString()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.pricePerUnitText,
                          { color: colors.textTetiary },
                        ]}
                      >
                        ₦{pricingInfo.pricePerUnit.toFixed(2)} per{' '}
                        {selectedProduct.unit}
                      </Text>
                    </View>
                  )}
                </View>
              )}

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <View style={styles.quantityHeader}>
                <Text style={[styles.quantityLabel, { color: colors.text }]}>
                  Quantity
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {selectedProduct.minimum_order_quantity &&
                    selectedProduct.minimum_order_quantity > 1 && (
                      <Text
                        style={[
                          styles.minQtyLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Min: {selectedProduct.minimum_order_quantity}{' '}
                        {selectedProduct.unit}(s)
                      </Text>
                    )}
                  {selectedProduct.order_increment &&
                    selectedProduct.order_increment > 1 && (
                      <Text
                        style={[
                          styles.minQtyLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        • Step: {selectedProduct.order_increment}
                      </Text>
                    )}
                </View>
              </View>

              <View style={styles.quantityControls}>
                <TouchableOpacity
                  onPress={decrement}
                  disabled={
                    quantity <= (selectedProduct.minimum_order_quantity || 1)
                  }
                  style={[
                    styles.quantityButton,
                    {
                      backgroundColor: colors.filter,
                      opacity:
                        quantity <=
                        (selectedProduct.minimum_order_quantity || 1)
                          ? 0.5
                          : 1,
                    },
                  ]}
                >
                  <Minus size={20} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.quantityValue, { color: colors.text }]}>
                  {quantity}
                </Text>

                <TouchableOpacity
                  onPress={increment}
                  disabled={quantity >= selectedProduct.stock}
                  style={[
                    styles.quantityButton,
                    {
                      backgroundColor: colors.filter,
                      opacity: quantity >= selectedProduct.stock ? 0.5 : 1,
                    },
                  ]}
                >
                  <Plus size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Add to Cart Button */}
            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={addingToCart || selectedProduct.stock === 0}
              style={[
                styles.addButton,
                {
                  backgroundColor: colors.secondary,
                  opacity: selectedProduct.stock === 0 ? 0.5 : 1,
                },
              ]}
            >
              {addingToCart ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <ShoppingBag size={20} color="#fff" />
                  <Text style={styles.addButtonText}>
                    Add to Cart - ₦
                    {pricingInfo && pricingInfo.discountPercent > 0
                      ? pricingInfo.total.toLocaleString()
                      : (selectedProduct.price * quantity).toLocaleString()}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : loading && !refreshing ? (
        // LOADING STATE
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading products...
          </Text>
        </View>
      ) : currentProducts.length === 0 ? (
        // EMPTY STATE
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.card, shadowColor: colors.text },
            ]}
          >
            <Package size={48} color={colors.textTetiary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No products in {selectedCategory}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Check other categories or come back later
          </Text>
        </View>
      ) : (
        // PRODUCT GRID
        <FlatList
          data={currentProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <ProductCard {...item} onPress={() => handleProductPress(item)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  vendorMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  // Product Detail Styles
  detailContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  wishlistButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  detailInfo: {
    padding: 20,
  },
  detailCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  promoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoContent: {
    flex: 1,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  promoExpiry: {
    fontSize: 11,
    fontWeight: '600',
  },
  promoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  discountPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  detailPrice: {
    fontSize: 28,
    fontWeight: '900',
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  percentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  originalPrice: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  detailUnit: {
    fontSize: 12,
    marginTop: 4,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  quantitySection: {
    marginBottom: 24,
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  minQtyLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bulkDiscountSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  activeDiscountBadge: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  activeDiscountText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  discountTiersContainer: {
    marginBottom: 12,
  },
  discountTiersTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  discountTierItem: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  discountTierText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nextTierBadge: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  nextTierText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  priceBreakdown: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 8,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceBreakdownLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceBreakdownValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  pricePerUnitText: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
});
