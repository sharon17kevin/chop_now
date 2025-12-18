import { useTheme } from '@/hooks/useTheme';
import { Database } from '@/types/database.types';
import { useRouter } from 'expo-router';
import { Heart, Plus, Star } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Product = Database['public']['Tables']['products']['Row'] & {
  profiles?: { full_name: string | null };
};

interface GridProductCardProps {
  product: Product;
}

export default function GridProductCard({ product }: GridProductCardProps) {
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
            uri:
              product.image_url ||
              'https://via.placeholder.com/150',
          }}
          style={styles.image}
        />
        {/* Like Button */}
        <TouchableOpacity style={styles.heartButton}>
          <Heart size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Discount Badge */}
        {product.discount_percentage ? (
          <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
            <Text style={styles.discountText}>-{product.discount_percentage}%</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          <Star size={10} color="#F59E0B" fill="#F59E0B" />
          <Text style={[styles.rating, { color: colors.textSecondary }]}>4.2</Text>
          <Text style={[styles.vendor, { color: colors.textTetiary }]} numberOfLines={1}>
            • {product.profiles?.full_name || 'Vendor'}
          </Text>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={[styles.price, { color: colors.primary }]}>
              ₦{product.price.toLocaleString()}
            </Text>
            {product.original_price && (
              <Text style={[styles.originalPrice, { color: colors.textTetiary }]}>
                ₦{product.original_price.toLocaleString()}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.secondary }]}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#FFF" />
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 5,
    borderRadius: 20,
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
