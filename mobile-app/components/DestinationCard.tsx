import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { Clock, Star, Heart } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useWishlist } from '@/hooks/useWishlist';

interface Props {
  id: string;
  description: string;
  image: string;
  name: string;
  address: string;
  isOpen: boolean;
  category: string;
  price: number;
  vendorId?: string;
  vendorName?: string;
  productId?: string; // For wishlist functionality
}

const DestinationCard = ({
  id,
  description,
  image,
  name,
  address,
  isOpen,
  category,
  price = 1600,
  vendorId,
  vendorName,
  productId,
}: Props) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const inWishlist = productId ? isInWishlist(productId) : false;

  const handleProductPress = () => {
    // Navigate to vendor page with product details
    if (vendorId) {
      router.push({
        pathname: '/vendor/[vendorId]' as any,
        params: {
          vendorId: vendorId,
          vendorName: vendorName || address || 'Vendor',
          vendorAddress: address,
          productId: productId, // Pass productId to auto-open product
        },
      });
    }
  };

  const handleVendorPress = (e: any) => {
    e.stopPropagation();
    if (vendorId) {
      router.push({
        pathname: '/vendor/[vendorId]' as any,
        params: {
          vendorId: vendorId,
          vendorName: vendorName || 'Vendor',
          vendorAddress: address,
        },
      });
    }
  };

  const handleWishlistToggle = async (e: any) => {
    e.stopPropagation();
    if (!productId) return;

    await toggleWishlist(productId);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleProductPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.main,
          {
            backgroundColor: colors.card,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          },
        ]}
      >
        <View
          style={[styles.imageContainer, { backgroundColor: colors.primary }]}
        >
          <Image source={{ uri: image }} style={styles.image} />

          {/* Wishlist button - top right */}
          {productId && (
            <TouchableOpacity
              onPress={handleWishlistToggle}
              style={[styles.wishlistButton, { backgroundColor: colors.card }]}
            >
              <Heart
                size={20}
                color={inWishlist ? colors.error : colors.textSecondary}
                fill={inWishlist ? colors.error : 'transparent'}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.infoContainer}>
          <View style={{ flex: 1 }}>
            <Text style={[{ color: colors.textTrans, fontWeight: '600' }]}>
              {name}
            </Text>
            <TouchableOpacity onPress={handleVendorPress} activeOpacity={0.7}>
              <Text
                numberOfLines={1}
                style={[
                  { color: colors.secondary, fontWeight: '600', fontSize: 12 },
                ]}
              >
                by {address}
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                { color: isOpen ? colors.success : colors.error, fontSize: 12 },
              ]}
            >
              {isOpen ? 'Available' : 'Out of Stock'}
            </Text>
          </View>
          <View
            style={[styles.categoryCard, { backgroundColor: colors.secondary }]}
          >
            <Text style={{ color: colors.text }}>{category || 'General'}</Text>
          </View>
        </View>
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, { alignItems: 'flex-start' }]}>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <Text
                style={[
                  { color: colors.textTrans, fontWeight: '700', fontSize: 16 },
                ]}
              >
                ₦{price.toLocaleString()}
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}
            >
              <Star
                size={13}
                fill={colors.secondary}
                color={colors.secondary}
              />
              <Text style={[{ color: colors.textTrans, fontWeight: '600' }]}>
                4.5
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const DestinationMiniCard = ({
  image,
  name,
  address, 
  isOpen,
  category,
  productId,
  vendorId,
  vendorName,
  discount,
  originalPrice,
}: Pick<
  Props,
  | 'image'
  | 'name'
  | 'address'
  | 'isOpen'
  | 'category'
  | 'productId'
  | 'vendorId'
  | 'vendorName'
> & {
  discount?: number | null;
  originalPrice?: number | null;
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();
  discount = 10

  const inWishlist = productId ? isInWishlist(productId) : false;

  const handlePress = () => {
    // Navigate to product page
    if (productId && vendorId) {
      router.push({
        pathname: '/product/[productId]' as any,
        params: {
          productId: productId,
          vendorId: vendorId,
        },
      });
    }
  };

  const handleWishlistToggle = async (e: any) => {
    e.stopPropagation();
    if (!productId) return;

    await toggleWishlist(productId);
  };

  return (
    <TouchableOpacity
      style={[styles.miniCard, { backgroundColor: colors.card }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.imageContainer,
          { position: 'relative', backgroundColor: colors.filter },
        ]}
      >
        <Image source={{ uri: image }} style={styles.image} />

        {/* Hot Deal Banner - diagonal ribbon */}
        {discount && discount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 12,
              left: -8,
              backgroundColor: '#DC2626',
              paddingVertical: 6,
              paddingHorizontal: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 0.5,
              }}
            >
              🔥 {discount}% OFF
            </Text>
          </View>
        )}

        {/* Wishlist button - top right */}
        {productId && (
          <TouchableOpacity
            onPress={handleWishlistToggle}
            style={[
              styles.miniWishlistButton,
              { backgroundColor: colors.card },
            ]}
          >
            <Heart
              size={16}
              color={inWishlist ? colors.error : colors.textSecondary}
              fill={inWishlist ? colors.error : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.miniInfoContainer}>
        <View style={{ flex: 1 }}>
          <Text
            style={[{ color: colors.text, fontWeight: '700', fontSize: 15 }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
            ]}
          >
            <Text>by {address || 'Vendor'}</Text>
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
              gap: 6,
            }}
          >
            <View
              style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}
            >
              <Star
                size={12}
                fill={colors.secondary}
                color={colors.secondary}
              />
              <Text
                style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}
              >
                4.5
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>•</Text>
            <Text
              style={{
                color: isOpen ? colors.success : colors.error,
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {isOpen ? 'Available' : 'Out of Stock'}
            </Text>
          </View>
          {/* Original price display */}
          {discount && discount > 0 && originalPrice && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 4,
                gap: 6,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  textDecorationLine: 'line-through',
                }}
              >
                ₦{originalPrice.toLocaleString()}
              </Text>
              <Text
                style={{
                  color: colors.success,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                Save ₦
                {(
                  originalPrice -
                  (originalPrice * (100 - discount)) / 100
                ).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DestinationCard;

const styles = StyleSheet.create({
  main: {
    flex: 1,
    height: 300,
    borderRadius: 15,
    padding: 15,
  },
  container: {
    flex: 1,
  },
  tag: {
    padding: 5,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  imageContainer: {
    flex: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  miniInfoContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    padding: 10,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    resizeMode: 'cover',
  },
  categoryCard: {
    padding: 5,
    borderRadius: 10,
  },
  miniCard: {
    width: 240,
    height: 240,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  miniWishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
