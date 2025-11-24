// components/ProductCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  unit: string;
  is_available: boolean;
  onPress?: () => void;
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  image_url,
  category,
  stock,
  unit,
  is_available,
  onPress,
}: ProductCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
     if (onPress) {
      onPress(); // Use custom handler if provided
    }
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
      {/* Product Image */}
      <Image
        source={{ uri: image_url }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Stock Badge */}
      {stock <= 10 && stock > 0 && (
        <View style={[styles.stockBadge, { backgroundColor: colors.warning }]}>
          <Text style={styles.stockText}>Low Stock</Text>
        </View>
      )}

      {/* Out of Stock Badge */}
      {stock === 0 && (
        <View style={[styles.stockBadge, { backgroundColor: colors.error }]}>
          <Text style={styles.stockText}>Out of Stock</Text>
        </View>
      )}

      {/* Product Info */}
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.text }]}
          numberOfLines={2}
        >
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

          <View style={[styles.categoryBadge, { backgroundColor: colors.filter }]}>
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
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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