// components/ProductCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { useWishlist } from '@/hooks/useWishlist';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images?: string[] | null;
  category: string;
  stock: number;
  unit: string;
  is_available: boolean;
  vendor_id?: string;
  vendor_name?: string;
  onPress?: () => void;
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  image_url,
  images,
  category,
  stock,
  unit,
  is_available,
  vendor_id,
  vendor_name,
  onPress,
}: ProductCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const inWishlist = isInWishlist(id);

  const handlePress = () => {
    if (onPress) {
      onPress(); // Use custom handler if provided
      return;
    }

    // Navigate to vendor page with product details
    if (vendor_id) {
      router.push({
        pathname: '/vendor/[vendorId]' as any,
        params: {
          vendorId: vendor_id,
          vendorName: vendor_name || 'Vendor',
          vendorAddress: vendor_name || '',
          productId: id,
        },
      });
    }
  };

  const handleWishlistToggle = async (e: any) => {
    e.stopPropagation();
    await toggleWishlist(id);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
      ]}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: images?.[0] || image_url || 'https://via.placeholder.com/200',
          }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Out of Stock Overlay */}
        {stock === 0 && (
          <View style={styles.outOfStockOverlay}>
            <View
              style={[
                styles.outOfStockBadge,
                { backgroundColor: colors.error },
              ]}
            >
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          </View>
        )}

        {/* Wishlist button - top right */}
        <TouchableOpacity
          onPress={handleWishlistToggle}
          style={[styles.wishlistButton, { backgroundColor: colors.card }]}
        >
          <Heart
            size={18}
            color={inWishlist ? colors.error : colors.textSecondary}
            fill={inWishlist ? colors.error : 'transparent'}
          />
        </TouchableOpacity>

        {/* Low Stock Badge - top left */}
        {stock <= 10 && stock > 0 && (
          <View
            style={[styles.stockBadge, { backgroundColor: colors.warning }]}
          >
            <Text style={styles.stockText}>Low Stock</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {name}
        </Text>

        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {description}
        </Text>

        <View style={styles.footer}>
          <View>
            <Text style={[styles.price, { color: colors.primary }]}>
              ₦{price.toLocaleString()}
            </Text>
            <Text style={[styles.unit, { color: colors.textTetiary }]}>
              per {unit}
            </Text>
          </View>

          <View
            style={[styles.categoryBadge, { backgroundColor: colors.filter }]}
          >
            <Text style={[styles.category, { color: colors.textSecondary }]}>
              {category}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
  },
  unit: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
  },
});
