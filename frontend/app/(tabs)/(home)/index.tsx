import { DestinationMiniCard } from '@/components/DestinationCard';
import FilterSquare from '@/components/FilterSquare';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import GridProductCard from '@/components/GridProductCard';
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
import {
  useProductStore,
  getHotDeals,
  getFreshPicks,
  CategoryFilter,
} from '@/stores/useProductStore';
import { useProducts } from '@/hooks/useProducts';
import { useTheme } from '@/hooks/useTheme';
import { useRouter, useFocusEffect } from 'expo-router';
import { Bell, MapPin, Search, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dimensions,
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
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const router = useRouter();
  const { colors } = useTheme();

  const categories = [
    {
      id: 1,
      name: 'Fruits',
      icon: <FruitIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 2,
      name: 'Meat',
      icon: <MeatIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 3,
      name: 'Vegetable',
      icon: <VegetableIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 4,
      name: 'Dairy',
      icon: <MilkIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 5,
      name: 'Grains',
      icon: <GrainsIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 6,
      name: 'Spices',
      icon: <SpiceIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 7,
      name: 'Sauces',
      icon: <OilIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 8,
      name: 'Legumes',
      icon: <LegumesIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 9,
      name: 'Flour',
      icon: <FlourIcon stroke={colors.primary} strokeWidth={2} />,
    },
    {
      id: 10,
      name: 'Essentials',
      icon: <Star size={24} color={colors.primary} strokeWidth={2} />,
    },
  ];
  // const [mode, setMode] = useState<string>('private');
  // const fadeAnim = useRef(new Animated.Value(1)).current;
  const width = Dimensions.get('window').width;

  // Use React Query for data fetching with Zustand for UI state
  const { selectedCategory, setCategory, loadMoreFreshPicks } =
    useProductStore();
  const {
    products,
    totalCount,
    freshPicksLimit,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useProducts();

  // Get smart product selections from the fetched products
  const hotDealsProducts = useMemo(() => getHotDeals(products), [products]);
  const freshPicksProducts = useMemo(
    () => getFreshPicks(products, freshPicksLimit),
    [products, freshPicksLimit]
  );
  const hasMoreProducts = totalCount > freshPicksLimit;

  // Memoized handler for load more
  const handleLoadMore = useCallback(() => {
    loadMoreFreshPicks();
  }, [loadMoreFreshPicks]);

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        setUnreadNotifications(count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Refresh notification count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  useEffect(() => {
    fetchUnreadCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Debug logging
  useEffect(() => {
    console.log('🏠 Products updated:', {
      selectedCategory,
      hotDeals: hotDealsProducts.length,
      freshPicks: freshPicksProducts.length,
      isLoading,
      error,
    });
  }, [
    hotDealsProducts,
    freshPicksProducts,
    selectedCategory,
    isLoading,
    error,
  ]);

  // Handle category filter click
  const handleCategoryPress = (categoryName: string) => {
    setCategory(categoryName as CategoryFilter);
  };

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
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/(tabs)/(profile)/notifications')}
          activeOpacity={0.7}
        >
          <Bell size={24} color="#FFFFFF" />
          {unreadNotifications > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
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
            Error:{' '}
            {error instanceof Error ? error.message : 'Failed to load products'}
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
              refreshing={isRefetching}
              onRefresh={() => refetch()}
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
              {/* All Category */}
              <FilterSquare
                key="all"
                icon={<Search size={24} color={colors.primary} />}
                text="All"
                onPress={() => handleCategoryPress('All')}
                isSelected={selectedCategory === 'All'}
              />
              {categories.map((category) => (
                <FilterSquare
                  key={category.id}
                  icon={category.icon}
                  text={category.name}
                  onPress={() => handleCategoryPress(category.name)}
                  isSelected={selectedCategory === category.name}
                />
              ))}
            </ScrollView>
          </View>

          {/* Hot Deals Near You */}
          <View style={{ width: '100%', marginBottom: 20 }}>
            <View style={styles.part}>
              <Text style={{ ...styles.sectionTitle, color: colors.text }}>
                🔥 Hot Deals Near You
              </Text>
            </View>
            {isLoading ? (
              <View style={{ width: '100%', paddingHorizontal: 20 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <ProductSkeleton variant="carousel" />
                  <ProductSkeleton variant="carousel" />
                  <ProductSkeleton variant="carousel" />
                </ScrollView>
              </View>
            ) : hotDealsProducts.length > 0 ? (
              <View style={{ width: '100%' }}>
                <Carousel
                  loop
                  autoPlay
                  autoPlayInterval={3000}
                  width={300}
                  height={250}
                  data={hotDealsProducts}
                  renderItem={({ item }) => (
                    <DestinationMiniCard
                      image={
                        item.images?.[0] ||
                        item.image_url ||
                        'https://via.placeholder.com/200'
                      }
                      name={item.name}
                      address={item.profiles?.full_name || 'Vendor'}
                      isOpen={true}
                      category={item.category || 'Other'}
                      productId={item.id}
                      vendorId={item.vendor_id}
                      vendorName={item.profiles?.full_name}
                      discount={item.discount_percentage}
                      originalPrice={item.original_price}
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

          {/* Fresh Picks */}
          <View style={{ width: '100%', paddingBottom: 10, marginBottom: 20 }}>
            <View style={styles.part}>
              <Text style={{ ...styles.sectionTitle, color: colors.text }}>
                ✨ Fresh Picks For You
              </Text>
            </View>

            {isLoading ? (
              <View style={styles.part}>
                <View
                  style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}
                >
                  <View style={{ flex: 1 }}>
                    <ProductSkeleton variant="card" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProductSkeleton variant="card" />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <ProductSkeleton variant="card" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProductSkeleton variant="card" />
                  </View>
                </View>
              </View>
            ) : freshPicksProducts.length > 0 ? (
              <View style={styles.part}>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 12,
                    paddingVertical: 10,
                  }}
                >
                  {freshPicksProducts.map((item) => (
                    <GridProductCard key={item.id} product={item} />
                  ))}
                </View>
                {/* Load More Button */}
                <TouchableOpacity
                  onPress={hasMoreProducts ? handleLoadMore : undefined}
                  disabled={!hasMoreProducts}
                  style={{
                    marginTop: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    backgroundColor: hasMoreProducts
                      ? colors.card
                      : colors.background,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: hasMoreProducts
                      ? colors.primary
                      : colors.border,
                    alignSelf: 'center',
                    opacity: hasMoreProducts ? 1 : 0.5,
                  }}
                  activeOpacity={hasMoreProducts ? 0.7 : 1}
                >
                  <Text
                    style={{
                      color: hasMoreProducts
                        ? colors.primary
                        : colors.textSecondary,
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    {hasMoreProducts
                      ? `Load More (${totalCount - freshPicksLimit} remaining)`
                      : 'All products loaded'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  gridProductCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '48%', // 2 columns with gap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  gridProductImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridProductInfo: {
    padding: 14,
  },
  gridWishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
