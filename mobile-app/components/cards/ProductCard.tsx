import { useTheme } from '@/hooks/useTheme';
import { Database } from '@/types/database.types';
import { useRouter } from 'expo-router';
import { Heart, Plus, Star } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Product = Database['public']['Tables']['products']['Row'] & {
  profiles?: { full_name: string | null };
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/(tabs)/(home)/items/[iteminfo]' as any,
      params: { iteminfo: product.id },
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, shadowColor: colors.text },
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
        <TouchableOpacity style={styles.heartButton}>
          <Heart size={18} color={colors.primary} />
        </TouchableOpacity>
        {product.discount_percentage && product.stock > 0 ? (
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
        <View style={styles.headerRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={[styles.rating, { color: colors.textSecondary }]}>
              4.5
            </Text>
          </View>
        </View>

        <Text
          style={[styles.vendor, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {product.profiles?.full_name || 'Vendor'}
        </Text>

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
            style={[styles.addButton, { backgroundColor: colors.secondary }]}
          >
            <Plus size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  vendor: {
    fontSize: 13,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 6,
    borderRadius: 20,
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
    top: 8,
    left: 8,
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
