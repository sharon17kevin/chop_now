import { useAddToCart } from '@/hooks/useAddToCart';
import { useTheme } from '@/hooks/useTheme';
import { Product, isDiscountActive } from '@/stores/useProductStore';
import { useUserStore } from '@/stores/useUserStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useRouter } from 'expo-router';
import { Heart, Plus, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

interface GridProductCardProps {
  product: Product;
}

export default function GridProductCard({ product }: GridProductCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { addToCart, addingToCart } = useAddToCart();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { profile, updateProfile } = useUserStore();

  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const inWishlist = isInWishlist(product.id);

  // Debug: Log stock value
  console.log(
    `Product: ${product.name}, Stock: ${product.stock}, Type: ${typeof product.stock}, IsZero: ${product.stock === 0}`,
  );

  const handlePress = () => {
    // Navigate to vendor page with product details
    if (product.id && product.vendor_id) {
      router.push({
        pathname: '/vendor/[vendorId]' as any,
        params: {
          vendorId: product.vendor_id,
          vendorName: product.profiles?.full_name || 'Vendor',
          productId: product.id,
        },
      });
    }
  };

  const handleAddToCart = async (e: any) => {
    e.stopPropagation();

    if (addingToCart) return;

    await addToCart({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      isAvailable: product.is_available,
      stock: product.stock,
    });
  };

  const handleToggleWishlist = async (e: any) => {
    e.stopPropagation();

    if (!profile?.id) {
      Alert.alert('Login Required', 'Please log in to save favorites');
      return;
    }

    if (isAddingToWishlist) return;

    setIsAddingToWishlist(true);
    try {
      await toggleWishlist(
        product.id,
        profile.id,
        profile.favorite_count || 0,
        (count) => updateProfile({ favorite_count: count }),
      );
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: product.image_url || 'https://via.placeholder.com/150',
          }}
          style={styles.image}
        />
        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <View style={styles.outOfStockOverlay}>
            <View
              style={[
                styles.outOfStockBadge,
                { backgroundColor: colors.error },
              ]}
            >
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          </View>
        )}
        {/* Like Button */}
        <TouchableOpacity
          style={[
            styles.heartButton,
            {
              backgroundColor: colors.card,
              shadowColor: colors.text,
            },
          ]}
          onPress={handleToggleWishlist}
          disabled={isAddingToWishlist}
          activeOpacity={0.7}
        >
          <Heart
            size={16}
            color={inWishlist ? colors.error : colors.textSecondary}
            fill={inWishlist ? colors.error : 'none'}
          />
        </TouchableOpacity>

        {/* Discount Badge */}
        {product.discount_percentage &&
        isDiscountActive(product) &&
        product.stock > 0 ? (
          <View
            style={[styles.discountBadge, { backgroundColor: colors.error }]}
          >
            <Text style={styles.discountText}>
              -{product.discount_percentage}%
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          <Star size={10} color="#F59E0B" fill="#F59E0B" />
          <Text style={[styles.rating, { color: colors.textSecondary }]}>
            4.2
          </Text>
          <Text
            style={[styles.vendor, { color: colors.textTetiary }]}
            numberOfLines={1}
          >
            • {product.profiles?.full_name || 'Vendor'}
          </Text>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={[styles.price, { color: colors.primary }]}>
              ₦{product.price.toLocaleString()}
            </Text>
            {product.original_price && (
              <Text
                style={[styles.originalPrice, { color: colors.textTetiary }]}
              >
                ₦{product.original_price.toLocaleString()}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: colors.secondary,
                opacity:
                  addingToCart || !product.is_available || product.stock === 0
                    ? 0.5
                    : 1,
              },
            ]}
            onPress={handleAddToCart}
            disabled={
              addingToCart || !product.is_available || product.stock === 0
            }
            activeOpacity={0.8}
          >
            {addingToCart ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Plus size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%', // 2 columns with gap
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
    // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 2,
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    height: 36, // Fixed height for 2 lines
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  rating: {
    fontSize: 10,
    fontWeight: '500',
  },
  vendor: {
    fontSize: 10,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 5,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
