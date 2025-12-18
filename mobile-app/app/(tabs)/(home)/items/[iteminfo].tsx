import { DestinationMiniCard } from '@/components/cards/DestinationCard';
import ExpandingTile from '@/components/common/ExpandingTile';
import Indicator from '@/components/common/Indicator';
import { miniCardsData } from '@/data/mockData';
import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/stores/useUserStore';
import { supabase } from '@/lib/supabase';
import { typography } from '@/styles/typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Heart, Share, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ItemInfoScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id, description, name, address, image, isOpen, category, price } =
    useLocalSearchParams();

  const isOpenBool = isOpen === 'true';
  const priceNum = parseFloat(price?.toString() || '0');

  const images = [
    image?.toString() ||
    'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg',
    'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg',
    'https://images.pexels.com/photos/34950/pexels-photo.jpg',
  ];

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

  const handleShare = () => {
    console.log('Sharing item:', name);
  };

  const progress = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const ITEM_WIDTH = Math.round(width * 0.86);

  // quantity state and handlers
  const [qty, setQty] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const increment = () => setQty((q) => q + 1);
  const decrement = () => setQty((q) => Math.max(1, q - 1));

  // Add to cart handler - saves to cart_items table
  const handleAddToBag = async () => {
    try {
      setIsAddingToCart(true);

      // Get user from Zustand store
      const profile = useUserStore.getState().profile;

      if (!profile?.id) {
        Alert.alert(
          'Login Required',
          'Please log in to add items to your cart'
        );
        return;
      }

      // Get product data from route params
      const productId = id?.toString() || '';
      // const vendorId = 'some-vendor-uuid';   // Will be fetched from product data

      // Check if item already in cart
      const { data: existingItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', profile.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking cart:', fetchError);
        throw fetchError;
      }

      if (existingItem) {
        // Update existing cart item quantity
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + qty })
          .eq('id', existingItem.id);

        if (updateError) {
          console.error('Error updating cart:', updateError);
          throw updateError;
        }

        Alert.alert(
          'Cart Updated',
          `Added ${qty} more. Total: ${existingItem.quantity + qty}`,
          [
            { text: 'Continue Shopping', style: 'cancel' },
            {
              text: 'View Cart',
              onPress: () => router.push('/(tabs)/(orders)'),
            },
          ]
        );
      } else {
        // Add new cart item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: profile.id,
            product_id: productId,
            quantity: qty,
          });

        if (insertError) {
          console.error('Error adding to cart:', insertError);
          throw insertError;
        }

        Alert.alert('Added to Cart', `${qty} item(s) added successfully!`, [
          { text: 'Continue Shopping', style: 'cancel' },
          {
            text: 'View Cart',
            onPress: () => router.push('/(tabs)/(orders)'),
          },
        ]);
      }

      // Reset quantity after adding
      setQty(1);
    } catch (error: any) {
      console.error('Add to cart error:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to add item to cart. Please try again.'
      );
    } finally {
      setIsAddingToCart(false);
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
                {name}
              </Text>
              <Text style={[typography.body2, { color: colors.textSecondary }]}>
                {category}
              </Text>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
              >
                <Text style={[typography.h3, { color: colors.secondary }]}>
                  ₦{priceNum.toFixed(2)}
                </Text>
                <Text
                  style={{
                    color: isOpenBool ? colors.success : colors.error,
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  • {isOpenBool ? 'Open' : 'Closed'}
                </Text>
              </View>
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
            address={address as string}
            description={`${description} This location is currently ${isOpenBool ? 'open' : 'closed'
              }.`}
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
                  params: { item: id },
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
                        width: `${(ratingData.breakdown[star] / sumCount) * 100
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Similar Options
            </Text>
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
          disabled={isAddingToCart}
          style={[
            styles.addBagButton,
            { backgroundColor: colors.secondary },
            isAddingToCart && { opacity: 0.6 },
          ]}
        >
          {isAddingToCart ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addBagText}>Add {qty} to Bag</Text>
          )}
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
