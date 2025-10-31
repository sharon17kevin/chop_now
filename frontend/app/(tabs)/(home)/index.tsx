import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Star, ShoppingCart, Car } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { SliderToggle } from '@/components/SliderToggle';
import FilterSquare from '@/components/FilterSquare';
import Carousel from 'react-native-reanimated-carousel';
import { miniCardsData } from '@/data/mockData';
import DestinationCard, {
  DestinationMiniCard,
} from '@/components/DestinationCard';
import { useRouter } from 'expo-router';

const categories = [
  { id: 1, name: 'Fruits', icon: '🍎', color: '#EF4444' },
  { id: 2, name: 'Vegetable', icon: '🥕', color: '#059669' },
  { id: 3, name: 'Dairy', icon: '🥛', color: '#3B82F6' },
  { id: 4, name: 'Grains', icon: '🌾', color: '#D97706' },
  { id: 5, name: 'Herbs', icon: '🌿', color: '#10B981' },
];

const featuredProducts = [
  {
    id: 1,
    name: 'Organic Tomatoes',
    price: 4.99,
    unit: 'per lb',
    farmer: 'Green Valley Farm',
    rating: 4.8,
    image:
      'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: '2.5 miles away',
  },
  {
    id: 2,
    name: 'Fresh Strawberries',
    price: 6.99,
    unit: 'per basket',
    farmer: 'Berry Fields',
    rating: 4.9,
    image:
      'https://images.pexels.com/photos/46174/strawberries-berries-fruit-freshness-46174.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: '1.8 miles away',
  },
  {
    id: 3,
    name: 'Farm Fresh Eggs',
    price: 5.49,
    unit: 'per dozen',
    farmer: 'Sunny Side Farm',
    rating: 4.7,
    image:
      'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: '3.2 miles away',
  },
];

const CARD_WIDTH = 100;
const SPACING = 12;

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { colors } = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<string>('private');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const scrollX = useRef(new Animated.Value(0)).current;
  const ITEM_WIDTH = 100; // each tab width
  const SPACING = 10;

  // Handle fade animation
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [mode]);

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.secondary }}
    >
      {/* Header */}
      <View style={{ ...styles.header, backgroundColor: colors.secondary }}>
        <View>
          <Text style={styles.greeting}>Delivering to</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: 'delivery' as any,
              })
            }
            style={styles.locationRow}
          >
            <MapPin size={16} color="#059669" />
            <Text style={styles.location}>San Francisco, CA</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.cartButton}>
          <ShoppingCart size={24} color="#059669" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for fresh produce..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View
        style={{
          ...styles.sliderContainer,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.1)', // light gray, subtle separation
          backgroundColor: '#fff',
        }}
      >
        <SliderToggle
          mode={mode}
          first="Food Ordering"
          second="Market Place"
          onToggle={(newMode) => setMode(newMode)}
          size={width * 0.23}
          thumbColor="#fff"
        />
      </View>
      <View
        style={{
          backgroundColor: colors.background,
          width: '100%',
          flex: 1,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Banner */}
          <View style={styles.part}>
            <View
              style={{
                ...styles.heroBanner,
                backgroundColor: '#fff', // required for shadow to show
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View
                style={{
                  flex: 4,
                  paddingHorizontal: 8,
                  borderTopLeftRadius: 16,
                  borderBottomLeftRadius: 16,
                  height: 200,
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ ...styles.heroTitle, color: colors.text }}>
                  Green Valley Farm
                </Text>
                <Text style={{ ...styles.heroSubtitle, color: colors.text }}>
                  Organic vegetables and fruits
                </Text>
              </View>
              <View
                style={{
                  flex: 7,
                  height: 200,
                  overflow: 'hidden',
                  borderTopRightRadius: 16,
                  borderBottomRightRadius: 16,
                }}
              >
                <Image
                  source={{
                    uri: 'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg?auto=compress&cs=tinysrgb&w=800',
                  }}
                  style={styles.heroImage}
                />
              </View>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={110} // item width + margin
              snapToAlignment="start"
              contentContainerStyle={{
                paddingHorizontal: 16,
              }}
            >
              {categories.map((category) => (
                <FilterSquare
                  key={category.id}
                  icon={
                    <Car color={colors.secondary} fill={colors.secondary} />
                  }
                  text={category.name}
                />
              ))}
            </ScrollView>
          </View>

          {/* Top Rated*/}
          <View style={{ width: '100%', marginBottom: 20 }}>
            <View style={styles.part}>
              <Text style={styles.sectionTitle}>Top Rated Near You</Text>
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

          {/* Ready To Eat */}
          <View style={{ width: '100%', marginBottom: 20 }}>
            <View style={styles.part}>
              <Text style={styles.sectionTitle}>Ready To Eat</Text>
              <View
                style={{
                  paddingVertical: 10,
                  gap: 16, // consistent vertical spacing
                }}
              >
                {miniCardsData.map((item, index) => (
                  <DestinationCard key={index} {...item} price={1600} />
                ))}
              </View>
            </View>
          </View>

          {/* Recommendations */}
          <View style={{ width: '100%', paddingBottom: 10, marginBottom: 20 }}>
            <View style={styles.part}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
            </View>

            <FlatList
              data={featuredProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.productCard, { marginRight: 16 }]}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.productImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.farmerName}>{item.farmer}</Text>
                    <View style={styles.ratingRow}>
                      <Star size={12} color="#FCD34D" fill="#FCD34D" />
                      <Text style={styles.rating}>{item.rating}</Text>
                      <Text style={styles.location}>• {item.location}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>${item.price}</Text>
                      <Text style={styles.unit}>{item.unit}</Text>
                    </View>
                    <TouchableOpacity style={styles.addToCartButton}>
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              snapToInterval={200 + 16}
              decelerationRate="fast"
              snapToAlignment="start"
              nestedScrollEnabled
              directionalLockEnabled
              getItemLayout={(_, index) => ({
                length: 200 + 16,
                offset: (200 + 16) * index,
                index,
              })}
            />
          </View>
          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  content: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sliderContainer: {
    paddingHorizontal: 20,
    height: 45,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    // Cross-platform subtle shadow
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.08,
    // shadowRadius: 4,
    // elevation: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  heroBanner: {
    width: '100%',
    flexDirection: 'row',
    flex: 1,
    marginVertical: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  // heroOverlay: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   backgroundColor: 'rgba(0, 0, 0, 0.4)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   padding: 20,
  // },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'left',
    opacity: 0.9,
    marginBottom: 16,
  },
  heroButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  part: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#059669',
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingLeft: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  productsContainer: {
    paddingLeft: 20,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    //width: width * 0.7,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  unit: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  addToCartButton: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  farmerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  farmerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  farmerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  farmerDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});
