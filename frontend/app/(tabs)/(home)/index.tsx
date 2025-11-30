import DestinationCard, {
  DestinationMiniCard,
} from '@/components/DestinationCard';
import FilterSquare from '@/components/FilterSquare';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import {
  FlourIcon,
  FruitIcon,
  GrainsIcon,
  LegumesIcon,
  MeatIcon,
  MilkIcon,
  OilIcon,
  SpiceIcon,
  VegetableIcon,
} from '@/components/vectors';
import { useHomeProducts } from '@/hooks/useHomeProducts';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { Bell, Car, MapPin, Search, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();
  const { colors } = useTheme();

  const categories = [
    {
      id: 1,
      name: 'Fruits',
      icon: <FruitIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 6,
      name: 'Meat',
      icon: <MeatIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 2,
      name: 'Vegetable',
      icon: <VegetableIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 3,
      name: 'Dairy',
      icon: <MilkIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 4,
      name: 'Grains',
      icon: <GrainsIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 5,
      name: 'Spices',
      icon: <SpiceIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 5,
      name: 'Sauces',
        icon: <OilIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 7,
      name: 'Legumes',
      icon: <LegumesIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 8,
      name: 'Flour',
      icon: <FlourIcon stroke={colors.primary} strokeWidth={2} />,
    },
  ];
  // const [mode, setMode] = useState<string>('private');
  // const fadeAnim = useRef(new Animated.Value(1)).current;
  const width = Dimensions.get('window').width;

  // Use custom hook for product data management
  const {
    topRatedProducts,
    readyToEatProducts,
    recommendedProducts,
    loading,
    refreshing,
    error,
    handleRefresh,
  } = useHomeProducts();

  // Handle search submission
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(tabs)/search',
        params: { query: searchQuery.trim() },
      });
    }
  };

  // Handle fade animation
  // useEffect(() => {
  //   fadeAnim.setValue(0);
  //   Animated.timing(fadeAnim, {
  //     toValue: 1,
  //     duration: 350,
  //     useNativeDriver: true,
  //   }).start();
  // }, [mode, fadeAnim]);

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.secondary }}
    >
      {/* Header */}
      <View style={{ ...styles.header, backgroundColor: colors.secondary }}>
        <View>
          <Text style={{ ...styles.greeting, color: '#FFFFFF' }}>
            Delivering to
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: 'delivery' as any,
              })
            }
            style={styles.locationRow}
          >
            <MapPin size={16} color="#FFFFFF" />
            <Text style={{ ...styles.location, color: '#FFFFFF' }}>
              San Francisco, CA
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.cartButton}>
          <Bell size={24} color="#FFFFFF" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View
        style={{
          ...styles.searchContainer,
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={handleSearchSubmit}>
          <Search
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
        </TouchableOpacity>
        <TextInput
          style={{ ...styles.searchInput, color: colors.text }}
          placeholder="Search for fresh produce..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textTetiary}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
      </View>

      {/* Error Banner */}
      {error && (
        <View
          style={{
            backgroundColor: colors.error,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginHorizontal: 12,
            marginVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: colors.buttonText, fontSize: 14 }}>
            Error: {error}
          </Text>
        </View>
      )}

      {/* <View
        style={{
          ...styles.sliderContainer,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
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
      </View> */}
      <View
        style={{
          backgroundColor: colors.background,
          width: '100%',
          flex: 1,
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Hero Banner */}
          <View style={styles.part}>
            <View
              style={{
                ...styles.heroBanner,
                backgroundColor: colors.card,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
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
                  backgroundColor: colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ ...styles.heroTitle, color: colors.text }}>
                  Green Valley Farm
                </Text>
                <Text
                  style={{
                    ...styles.heroSubtitle,
                    color: colors.textSecondary,
                  }}
                >
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
                  icon={category.icon}
                  text={category.name}
                />
              ))}
            </ScrollView>
          </View>

          {/* Top Rated*/}
          <View style={{ width: '100%', marginBottom: 20 }}>
            <View style={styles.part}>
              <Text style={{ ...styles.sectionTitle, color: colors.text }}>
                Top Rated Near You
              </Text>
            </View>
            {loading ? (
              <View style={{ width: '100%', paddingHorizontal: 20 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <ProductSkeleton variant="carousel" />
                  <ProductSkeleton variant="carousel" />
                  <ProductSkeleton variant="carousel" />
                </ScrollView>
              </View>
            ) : topRatedProducts.length > 0 ? (
              <View style={{ width: '100%' }}>
                <Carousel
                  loop
                  autoPlay
                  autoPlayInterval={2000}
                  width={300}
                  height={250}
                  data={topRatedProducts}
                  renderItem={({ item }) => (
                    <DestinationMiniCard
                      image={item.image_url}
                      name={item.name}
                      address={item.profiles?.full_name || 'Vendor'}
                      isOpen={true}
                      category={item.category}
                      productId={item.id}
                      vendorId={item.vendor_id}
                      vendorName={item.profiles?.full_name}
                    />
                  )}
                  style={{
                    width: width,
                  }}
                  onConfigurePanGesture={(g) =>
                    g.activeOffsetX([-10, 10]).failOffsetY([-10, 10])
                  }
                />
              </View>
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary }}>
                  No products available
                </Text>
              </View>
            )}
          </View>

          {/* Ready To Eat */}
          <View style={{ width: '100%', marginBottom: 20 }}>
            <View style={styles.part}>
              <Text style={{ ...styles.sectionTitle, color: colors.text }}>
                Ready To Eat
              </Text>
              {loading ? (
                <View style={{ paddingVertical: 10, gap: 16 }}>
                  <ProductSkeleton variant="list" />
                  <ProductSkeleton variant="list" />
                  <ProductSkeleton variant="list" />
                </View>
              ) : readyToEatProducts.length > 0 ? (
                <View
                  style={{
                    paddingVertical: 10,
                    gap: 16,
                  }}
                >
                  {readyToEatProducts.map((item) => (
                    <DestinationCard
                      id={item.id}
                      description={item.description}
                      key={item.id}
                      image={item.image_url}
                      name={item.name}
                      address={item.profiles?.full_name || 'Vendor'}
                      category={item.category}
                      isOpen={item.is_available}
                      price={item.price}
                      vendorId={item.vendor_id}
                      vendorName={item.profiles?.full_name}
                      productId={item.id}
                    />
                  ))}
                </View>
              ) : (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>
                    No products available
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Recommendations */}
          <View style={{ width: '100%', paddingBottom: 10, marginBottom: 20 }}>
            <View style={styles.part}>
              <Text style={{ ...styles.sectionTitle, color: colors.text }}>
                Recommendations
              </Text>
            </View>

            {loading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <ProductSkeleton variant="card" />
                <ProductSkeleton variant="card" />
                <ProductSkeleton variant="card" />
              </ScrollView>
            ) : recommendedProducts.length > 0 ? (
              <FlatList
                data={recommendedProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                      {
                        ...styles.productCard,
                        backgroundColor: colors.card,
                        shadowColor: colors.text,
                      },
                      { marginRight: 16 },
                    ]}
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.productImage}
                    />
                    <View style={styles.productInfo}>
                      <Text
                        style={{ ...styles.productName, color: colors.text }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          ...styles.farmerName,
                          color: colors.textSecondary,
                        }}
                      >
                        {item.profiles?.full_name || 'Vendor'}
                      </Text>
                      <View style={styles.ratingRow}>
                        <Star size={12} color="#FCD34D" fill="#FCD34D" />
                        <Text style={{ ...styles.rating, color: colors.text }}>
                          {item.rating || 4.5}
                        </Text>
                        <Text
                          style={{
                            ...styles.location,
                            color: colors.textSecondary,
                          }}
                        >
                          • {item.stock} in stock
                        </Text>
                      </View>
                      <View style={styles.priceRow}>
                        <Text
                          style={{ ...styles.price, color: colors.primary }}
                        >
                          ₦{item.price.toLocaleString()}
                        </Text>
                        <Text
                          style={{
                            ...styles.unit,
                            color: colors.textSecondary,
                          }}
                        >
                          {item.unit}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{
                          ...styles.addToCartButton,
                          backgroundColor: colors.primary,
                        }}
                      >
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
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary }}>
                  No products available
                </Text>
              </View>
            )}
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
    color: '#FFFFFF',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: '#FFFFFF',
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
    backgroundColor: '#DC2626',
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
    color: '#1C1917',
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
    opacity: 0.8,
    marginBottom: 16,
  },
  heroButton: {
    backgroundColor: '#f6891f',
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
    color: '#1C1917',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#f6891f',
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
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    color: '#1C1917',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 14,
    color: '#78716C',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    color: '#1C1917',
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
    color: '#f6891f',
  },
  unit: {
    fontSize: 12,
    color: '#78716C',
    marginLeft: 4,
  },
  addToCartButton: {
    backgroundColor: '#f6891f',
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
    color: '#78716C',
    marginBottom: 4,
  },
});
