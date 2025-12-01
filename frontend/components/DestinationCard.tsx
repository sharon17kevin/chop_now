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

  const inWishlist = productId ? isInWishlist(productId) : false;

  const handlePress = () => {
    // Navigate to vendor page with product details if available
    if (vendorId && productId) {
      router.push({
        pathname: '/vendor/[vendorId]' as any,
        params: {
          vendorId: vendorId,
          vendorName: vendorName || name,
          vendorAddress: address,
          productId: productId,
        },
      });
      return;
    }

    // Fallback: Convert item name to URL-friendly format that matches the item page keys
    let itemSlug = name.toLowerCase().replace(/\s+/g, '-');

    // Handle special cases to match the item page keys exactly
    if (name === "Domino's Pizza") {
      itemSlug = 'dominos-pizza';
    } else if (name === 'Cafe Neo') {
      itemSlug = 'cafe-neo';
    } else if (name === 'Spice Route') {
      itemSlug = 'spice-route';
    } else if (name === 'The Grill') {
      itemSlug = 'the-grill';
    } else if (name === 'Bukka Hut') {
      itemSlug = 'bukka-hut';
    }

    router.push({
      pathname: 'places/[item]' as any,
      params: { item: itemSlug },
    });
  };

  const handleWishlistToggle = async (e: any) => {
    e.stopPropagation();
    if (!productId) return;

    await toggleWishlist(productId);
  };

  return (
    <TouchableOpacity
      style={[styles.miniCard]}
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

        {/* Deal badge - only show if discount exists */}
        {discount && discount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: '#DC2626',
              borderRadius: 10,
              paddingVertical: 4,
              paddingHorizontal: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}>
              {discount}% OFF
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
              size={18}
              color={inWishlist ? colors.error : colors.textSecondary}
              fill={inWishlist ? colors.error : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.miniInfoContainer}>
        <View style={{ flex: 1, paddingTop: 3 }}>
          <Text style={[{ color: colors.text, fontWeight: '600' }]}>
            {name}
          </Text>
          <Text numberOfLines={2} style={[{ color: colors.text }]}>
            {address}
            <Text style={{ color: isOpen ? colors.success : colors.error }}>
              {isOpen ? ' | Open' : ' | Closed'}
            </Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <Clock size={13} color={colors.secondary} />
            <Text style={{ color: colors.text }}>20-30 mins</Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Star size={13} fill={colors.secondary} color={colors.secondary} />
        <Text style={{ color: colors.text }}>4.5</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
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
    width: 230,
    height: 250,
    marginHorizontal: 8,
    borderRadius: 15,
    overflow: 'hidden',
    padding: 10,
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
  },
});
