import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  View,
  Animated,
} from 'react-native';
import React, { useState } from 'react';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { typography } from '@/styles/typography';
import { ArrowLeft, Clock, Heart, Share, Star } from 'lucide-react-native';
import ExpandingTile from '@/components/ExpandingTile';
import Carousel from 'react-native-reanimated-carousel';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Indicator from '@/components/Indicator';
import { miniCardsData } from '@/data/mockData';
import { DestinationMiniCard } from '@/components/DestinationCard';

const { width } = Dimensions.get('window');

const images = [
  'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg',
  'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg',
  'https://images.pexels.com/photos/34950/pexels-photo.jpg',
];

export default function ItemInfoScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { item } = useLocalSearchParams();
  const [activeIndex, setActiveIndex] = useState(0);

  const ratingData = {
    average: 4.6,
    total: 2053,
    breakdown: {
      '5': 1500,
      '4': 350,
      '3': 120,
      '2': 50,
      '1': 33,
    } as Record<string, number>,
  };
  const sumCount = Object.values(ratingData.breakdown).reduce(
    (a, b) => a + b,
    0
  );

  const itemName = item
    ? item
        .toString()
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Item';

  // Get item description based on name
  const getItemDescription = (name: string) => {
    const itemDescriptions: {
      [key: string]: { title: string; description: string; address: string };
    } = {
      'chicken-republic': {
        title: 'Chicken Republic',
        description:
          'A beloved fast-food chain specializing in delicious fried chicken, grilled chicken, and local favorites. Known for their crispy chicken, jollof rice, and friendly service. Perfect for quick meals and family dining with locations across Nigeria.',
        address: '123 Victoria Island, Lagos, Nigeria',
      },
      'dominos-pizza': {
        title: "Domino's Pizza",
        description:
          'World-famous pizza chain offering fresh, hot pizzas delivered to your door. Features a wide variety of toppings, sides, and beverages. Known for their 30-minute delivery guarantee and quality ingredients.',
        address: '456 Ikeja GRA, Lagos, Nigeria',
      },
      'cafe-neo': {
        title: 'Cafe Neo',
        description:
          'A modern coffee shop chain serving premium coffee, pastries, and light meals. Perfect for meetings, work sessions, or casual hangouts. Features comfortable seating and free Wi-Fi in a relaxed atmosphere.',
        address: '789 Lekki Phase 1, Lagos, Nigeria',
      },
      kilimanjaro: {
        title: 'Kilimanjaro',
        description:
          'A popular item chain offering a mix of local and international cuisine. Known for their generous portions, affordable prices, and family-friendly atmosphere. Great for casual dining and group gatherings.',
        address: '321 Surulere, Lagos, Nigeria',
      },
      'spice-route': {
        title: 'Spice Route',
        description:
          'Authentic Indian item serving traditional dishes from various regions of India. Features aromatic spices, tandoori specialties, and vegetarian options. Perfect for those craving bold flavors and authentic Indian cuisine.',
        address: '654 Allen Avenue, Ikeja, Lagos, Nigeria',
      },
      'the-grill': {
        title: 'The Grill',
        description:
          'Premium steakhouse and grill item offering high-quality meats, seafood, and grilled specialties. Features an upscale atmosphere, extensive wine list, and professional service. Ideal for special occasions and business dining.',
        address: '987 Banana Island, Lagos, Nigeria',
      },
      'bukka-hut': {
        title: 'Bukka Hut',
        description:
          'Traditional Nigerian item serving authentic local dishes and street food favorites. Known for their amala, ewedu, and other Yoruba specialties. Offers a true taste of Nigerian culture and hospitality.',
        address: '147 Yaba, Lagos, Nigeria',
      },
      wakkis: {
        title: 'Wakkis',
        description:
          'Contemporary Indian item with a modern twist on traditional dishes. Features fusion cuisine, creative presentations, and a vibrant atmosphere. Perfect for those who enjoy innovative takes on classic Indian flavors.',
        address: '258 Maryland, Ikeja, Lagos, Nigeria',
      },
      nkoyo: {
        title: 'Nkoyo',
        description:
          'Upscale Nigerian item offering refined interpretations of traditional dishes. Features elegant dining, premium ingredients, and sophisticated service. Ideal for special occasions and fine dining experiences.',
        address: '369 Ikoyi, Lagos, Nigeria',
      },
      jevinik: {
        title: 'Jevinik',
        description:
          'African fusion item combining traditional African flavors with modern culinary techniques. Features diverse menu options, cultural ambiance, and innovative dishes. Perfect for exploring African cuisine in a contemporary setting.',
        address: '741 Victoria Island, Lagos, Nigeria',
      },
    };

    return (
      itemDescriptions[name.toLowerCase()] || {
        title: itemName,
        description:
          'A wonderful item offering delicious food and great service. Perfect for dining with family and friends in a comfortable and welcoming atmosphere.',
        address: 'item Address, City, Country',
      }
    );
  };

  const itemInfo = getItemDescription(item?.toString() || '');

  const handleShare = () => {
    console.log('Sharing item:', item);
  };

  const progress = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const ITEM_WIDTH = Math.round(width * 0.86);
  // quantity state and handlers (placeholders)
  const [qty, setQty] = useState(1);
  const increment = () => setQty((q) => q + 1);
  const decrement = () => setQty((q) => Math.max(1, q - 1));

  // Placeholder add-to-bag handler. Replace with real cart/store integration.
  const handleAddToBag = () => {
    // TODO: wire this to your cart/store (e.g. zustand addToCart)
    // For now, navigate to /cart as a placeholder
    try {
      router.push('/cart');
    } catch (e) {
      console.warn('handleAddToBag: navigation failed', e);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={[styles.header]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare}>
          <Share size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
      >
        {/* Image section */}
        <View style={{ width: '100%', alignItems: 'center' }}>
          <Carousel
            width={ITEM_WIDTH}
            height={250}
            data={images}
            mode="horizontal-stack" // 👈 enables centered layout
            modeConfig={{
              snapDirection: 'left',
              stackInterval: 0,
              moveSize: 0,
            }}
            autoPlay
            autoPlayInterval={3000}
            scrollAnimationDuration={3000}
            onProgressChange={(_, absoluteProgress) => {
              progress.value = absoluteProgress;
            }}
            onConfigurePanGesture={(g) =>
              g.activeOffsetX([-10, 10]).failOffsetY([-10, 10])
            }
            renderItem={({ item }) => (
              <View
                style={{
                  width: ITEM_WIDTH,
                  borderRadius: 15,
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={{ uri: item }}
                  style={{
                    width: '100%',
                    height: 250,
                    resizeMode: 'cover',
                  }}
                />
              </View>
            )}
          />

          {/* Animated indicators */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 10,
            }}
          >
            {images.map((_, index) => (
              <Indicator key={index} progress={progress} index={index} />
            ))}
          </View>
        </View>

        {/* Description section */}
        <View style={[styles.container, { gap: 10 }]}>
          <View
            style={{
              flexDirection: 'row',
              flex: 1,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ gap: 10 }}>
              <Text style={[typography.h3, { color: colors.text }]}>
                {itemInfo.title}
              </Text>
              <Text style={[typography.h3, { color: colors.secondary }]}>
                $15.99
              </Text>
            </View>
            <Heart size={24} color={colors.secondary} />
          </View>
          <View
            style={{
              backgroundColor: 'rgba(246, 137, 31, 0.2)',
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 5,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.secondary, fontWeight: '900' }}>
                $
              </Text>
              <Text style={[typography.body2, { color: colors.text }]}>
                {' '}
                Free Delivery
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Clock
                size={16}
                fill={colors.secondary}
                color={colors.background}
                style={{ marginRight: 4 }}
              />
              <Text style={[typography.body2, { color: colors.text }]}>
                20-30 mins
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Star
                size={16}
                fill={colors.secondary}
                color={'transparent'}
                style={{ marginRight: 4 }}
              />
              <Text style={[typography.body2, { color: colors.text }]}>
                4.5
              </Text>
            </View>
          </View>

          <ExpandingTile
            title="Description"
            address={itemInfo.address}
            description={itemInfo.description}
          />
        </View>

        {/* Rating section */}
        <View style={styles.ratingSection}>
          {/* Left: Average */}
          <View style={styles.ratingAverage}>
            <Text style={[typography.h1, { color: colors.text }]}>
              {ratingData.average.toFixed(1)}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {[5, 4, 3, 2, 1].map((star: number) => (
                <Star
                  size={20}
                  key={star}
                  fill={colors.secondary}
                  color={colors.secondary}
                  style={{ marginLeft: 2, marginBottom: 5 }}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/reviews',
                  params: { item },
                })
              }
            >
              <Text
                style={[
                  typography.body2,
                  { color: colors.textSecondary, marginTop: 4 },
                ]}
              >
                {ratingData.total} ratings
              </Text>
            </TouchableOpacity>
          </View>
          {/* Right: Breakdown */}
          <View style={styles.ratingBreakdown}>
            {['5', '4', '3', '2', '1'].map((star: string) => (
              <View key={star} style={styles.ratingRow}>
                <Text
                  style={[
                    typography.body2,
                    { color: colors.textSecondary, width: 16 },
                  ]}
                >
                  {star}
                </Text>

                <View
                  style={[
                    styles.progressBarBackground,
                    { backgroundColor: colors.textSecondary },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${
                          (ratingData.breakdown[star] / sumCount) * 100
                        }%`,
                        backgroundColor: colors.secondary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    typography.body2,
                    {
                      color: colors.textSecondary,
                      width: 36,
                      textAlign: 'right',
                    },
                  ]}
                >
                  {`${Math.round(
                    (ratingData.breakdown[star] / sumCount) * 100
                  )}%`}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/*Similar*/}
        <View style={{ width: '100%', marginBottom: 20 }}>
          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Similar Options</Text>
          </View>
          <View style={{ width: '100%' }}>
            <Carousel
              loop
              autoPlay
              autoPlayInterval={2000}
              width={300}
              height={250}
              data={miniCardsData}
              renderItem={({ item }) => <DestinationMiniCard {...item} />}
              style={{
                width: width,
              }}
              onConfigurePanGesture={
                (g) =>
                  g
                    .activeOffsetX([-10, 10]) // require a horizontal drag
                    .failOffsetY([-10, 10]) // let vertical drags pass through
              }
            />
          </View>
        </View>
      </ScrollView>
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            width: '100%',
            paddingBottom: insets.bottom ? insets.bottom : 12,
          },
        ]}
      >
        <View style={styles.qtyRow}>
          <TouchableOpacity
            onPress={decrement}
            style={[styles.qtyButton, { borderColor: colors.inputBorder }]}
          >
            <Text style={{ color: colors.text }}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.qtyText, { color: colors.text }]}>{qty}</Text>
          <TouchableOpacity
            onPress={increment}
            style={[styles.qtyButton, { borderColor: colors.inputBorder }]}
          >
            <Text style={{ color: colors.text }}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleAddToBag}
          style={[styles.addBagButton, { backgroundColor: colors.secondary }]}
        >
          <Text style={styles.addBagText}>Add {qty} to Bag</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    gap: 24,
  },
  ratingAverage: {
    alignItems: 'center',
    minWidth: 60,
  },
  ratingBreakdown: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 8,
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#00000008',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    minWidth: 28,
    textAlign: 'center',
    fontWeight: '700',
  },
  addBagButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  addBagText: {
    color: '#fff',
    fontWeight: '700',
  },
  checkoutButton: {
    position: 'absolute',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    zIndex: 50,
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
});
