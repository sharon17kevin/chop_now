import React, { memo } from 'react';
import { TouchableOpacity, View, Image, Text, StyleSheet } from 'react-native';
import { Star, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useWishlist } from '@/hooks/useWishlist';
import { Product } from '@/stores/useProductStore';

interface GridProductCardProps {
  product: Product;
}

const GridProductCard = memo(
  ({ product }: GridProductCardProps) => {
    const router = useRouter();
    const { colors } = useTheme();
    const { isInWishlist, toggleWishlist } = useWishlist();

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/product/${product.id}` as any)}
        style={[
          styles.gridProductCard,
          {
            backgroundColor: colors.card,
            shadowColor: colors.text,
          },
        ]}
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={{
              uri: product.image_url || 'https://via.placeholder.com/200',
            }}
            style={styles.gridProductImage}
          />
          <TouchableOpacity
            onPress={async (e) => {
              e.stopPropagation();
              await toggleWishlist(product.id);
            }}
            style={[
              styles.gridWishlistButton,
              { backgroundColor: colors.card },
            ]}
          >
            <Heart
              size={16}
              color={
                isInWishlist(product.id) ? colors.error : colors.textSecondary
              }
              fill={isInWishlist(product.id) ? colors.error : 'transparent'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.gridProductInfo}>
          <Text
            style={[styles.productName, { color: colors.text }]}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          <Text
            style={[styles.farmerName, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {product.profiles?.full_name || 'Vendor'}
          </Text>
          <View style={styles.priceRow}>
            <View style={styles.ratingContainer}>
              <Star size={11} color="#FCD34D" fill="#FCD34D" />
              <Text style={[styles.rating, { color: colors.text }]}>
                {product.rating || 4.5}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: colors.primary }]}>
                ₦{product.price.toLocaleString()}
              </Text>
              <Text style={[styles.unit, { color: colors.textSecondary }]}>
                /{product.unit}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if product data changed
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.price === nextProps.product.price &&
      prevProps.product.rating === nextProps.product.rating &&
      prevProps.product.image_url === nextProps.product.image_url
    );
  }
);

GridProductCard.displayName = 'GridProductCard';

const styles = StyleSheet.create({
  gridProductCard: {
    borderRadius: 12,
    width: '48%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  gridProductImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridProductInfo: {
    padding: 14,
  },
  gridWishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 11,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 11,
    marginLeft: 3,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 10,
  },
  addToCartButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GridProductCard;
