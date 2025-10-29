import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ArrowDown, ArrowUp, Clock, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface Props {
  image: string;
  name: string;
  address: string;
  isOpen: boolean;
  category: string;
  price: number;
}

const DestinationCard = ({
  image,
  name,
  address,
  isOpen,
  category,
  price = 1600,
}: Props) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    // Convert restaurant name to URL-friendly format that matches the restaurant page keys
    let restaurantSlug = name.toLowerCase().replace(/\s+/g, '-');

    // Handle special cases to match the restaurant page keys exactly
    if (name === "Domino's Pizza") {
      restaurantSlug = 'dominos-pizza';
    } else if (name === 'Cafe Neo') {
      restaurantSlug = 'cafe-neo';
    } else if (name === 'Spice Route') {
      restaurantSlug = 'spice-route';
    } else if (name === 'The Grill') {
      restaurantSlug = 'the-grill';
    } else if (name === 'Bukka Hut') {
      restaurantSlug = 'bukka-hut';
    }

    router.push({
      pathname: '/places/[restaurant]' as any,
      params: { restaurant: restaurantSlug },
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.main,
          {
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 2,
          },
        ]}
      >
        <View
          style={[styles.imageContainer, { backgroundColor: colors.secondary }]}
        >
          <Image source={{ uri: image }} style={styles.image} />
        </View>
        <View style={styles.infoContainer}>
          <View style={{ flex: 1 }}>
            <Text style={[{ color: colors.textTrans, fontWeight: '600' }]}>
              {name}
            </Text>
            <Text numberOfLines={2} style={[{ color: colors.textTrans }]}>
              {address} |
              <Text style={{ color: isOpen ? colors.success : colors.error }}>
                {isOpen ? ' Open' : ' Closed'}
              </Text>
            </Text>
          </View>
          <View
            style={[styles.categoryCard, { backgroundColor: colors.secondary }]}
          >
            <Text>{category}</Text>
          </View>
        </View>
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, { alignItems: 'flex-start' }]}>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <Star
                size={13}
                fill={colors.secondary}
                color={colors.secondary}
              />
              <Text style={[{ color: colors.textTrans, fontWeight: '600' }]}>
                Rating
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <Text style={[{ color: colors.textTrans, fontWeight: '600' }]}>
                {price}
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
}: Pick<Props, 'image' | 'name' | 'address' | 'isOpen' | 'category'>) => {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    // Convert restaurant name to URL-friendly format that matches the restaurant page keys
    let restaurantSlug = name.toLowerCase().replace(/\s+/g, '-');

    // Handle special cases to match the restaurant page keys exactly
    if (name === "Domino's Pizza") {
      restaurantSlug = 'dominos-pizza';
    } else if (name === 'Cafe Neo') {
      restaurantSlug = 'cafe-neo';
    } else if (name === 'Spice Route') {
      restaurantSlug = 'spice-route';
    } else if (name === 'The Grill') {
      restaurantSlug = 'the-grill';
    } else if (name === 'Bukka Hut') {
      restaurantSlug = 'bukka-hut';
    }

    router.push({
      pathname: 'places/[restaurant]' as any,
      params: { restaurant: restaurantSlug },
    });
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
          { position: 'relative', backgroundColor: colors.secondary },
        ]}
      >
        <Image source={{ uri: image }} style={styles.image} />

        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: colors.secondary,
            borderRadius: 10,
            paddingVertical: 3,
            paddingHorizontal: 8,
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
            30% OFF
          </Text>
        </View>
      </View>
      <View style={styles.miniInfoContainer}>
        <View style={{ flex: 1, paddingTop: 3 }}>
          <Text style={[{ color: colors.text, fontWeight: '600' }]}>
            {name}
          </Text>
          <Text numberOfLines={2} style={[{ color: colors.text }]}>
            {address} |
            <Text style={{ color: isOpen ? colors.success : colors.error }}>
              {isOpen ? ' Open' : ' Closed'}
            </Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <Clock size={13} color={colors.secondary} />
            <Text>20-30 mins</Text>
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
});
