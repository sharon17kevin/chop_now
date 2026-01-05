import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { Search, Filter, Heart, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearch } from '@/hooks/useSearch';
import { useWishlist } from '@/hooks/useWishlist';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSearchStore } from '@/stores/useSearchStore';

const categories = [
  'All',
  'Vegetables',
  'Fruits',
  'Dairy',
  'Meat',
  'Bakery',
  'Beverages',
];

const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name A-Z', value: 'name' },
];

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // BottomSheet ref and snap points
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '80%'], []);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  // Handle bottom sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    // Sheet state is managed by the ref
  }, []);

  // Get search history from store
  const {
    recentSearches,
    popularSearches,
    fetchPopularSearches,
    clearRecentSearches,
    removeRecentSearch,
  } = useSearchStore();

  // Fetch popular searches on mount
  useEffect(() => {
    fetchPopularSearches();
  }, [fetchPopularSearches]);

  // Set search query from navigation params
  useEffect(() => {
    if (params.query && typeof params.query === 'string') {
      setSearchQuery(params.query);
    }
  }, [params.query]);

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(searchQuery, 400);

  // Use search hook with debounced query and filters
  const { results, loading, error, filters, setFilters, clearFilters } =
    useSearch(debouncedQuery);

  // Wishlist functionality
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Add to cart functionality
  const { addToCart } = useAddToCart();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleProductPress = (product: any) => {
    router.push({
      pathname: '/vendor/[vendorId]' as any,
      params: {
        vendorId: product.vendor_id,
        vendorName: product.vendor?.full_name || 'Vendor',
        vendorAddress: product.vendor?.full_name || '',
        productId: product.id,
      },
    });
  };

  const handleWishlistToggle = async (productId: string, e: any) => {
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  const handleAddToCart = async (product: any, e: any) => {
    e.stopPropagation();
    await addToCart({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      isAvailable: product.is_available,
      stock: product.stock,
    });
  };

  const handleCategoryFilter = (category: string) => {
    setFilters({ category: category === 'All' ? null : category });
  };

  const handleSortChange = (sortValue: string) => {
    setFilters({ sortBy: sortValue as any });
  };

  const handleClearFilters = () => {
    clearFilters();
    bottomSheetRef.current?.close();
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== null && v !== undefined
  ).length;

  const isSearching = debouncedQuery.length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Search</Text>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.card, shadowColor: colors.text },
        ]}
      >
        <Search
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="What are you looking for?"
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => bottomSheetRef.current?.snapToIndex(0)}
        >
          <Filter size={20} color={colors.success} />
          {activeFiltersCount > 0 && (
            <View
              style={[styles.filterBadge, { backgroundColor: colors.error }]}
            >
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!isSearching ? (
          <>
            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Popular Searches
                </Text>
                <View style={styles.tagsContainer}>
                  {popularSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.tagButton,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => handleSearch(search)}
                    >
                      <Text style={[styles.tagText, { color: colors.text }]}>
                        {search}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.recentHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Recent Searches
                  </Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={[styles.clearText, { color: colors.error }]}>
                      Clear All
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recentSearches}>
                  {recentSearches.map((search, index) => (
                    <View key={index} style={styles.recentSearchRow}>
                      <TouchableOpacity
                        style={styles.recentSearchItem}
                        onPress={() => handleSearch(search)}
                      >
                        <Search size={16} color={colors.textSecondary} />
                        <Text
                          style={[
                            styles.recentSearchText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {search}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeRecentSearch(search)}
                        style={styles.removeButton}
                      >
                        <X size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Searching...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Search size={48} color={colors.textTetiary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No products found
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Try searching with different keywords
            </Text>
          </View>
        ) : (
          // Search Results from Database
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {results.length} Result{results.length !== 1 ? 's' : ''} for
              &quot;{debouncedQuery}&quot;
            </Text>
            {results.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.resultCard,
                  { backgroundColor: colors.card, shadowColor: colors.text },
                ]}
                onPress={() => handleProductPress(product)}
              >
                <Image
                  source={{
                    uri: product.image_url || 'https://via.placeholder.com/80',
                  }}
                  style={styles.resultImage}
                />
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultName, { color: colors.text }]}>
                    {product.name}
                  </Text>
                  <Text
                    style={[
                      styles.resultFarmer,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {product.vendor?.full_name || 'Unknown Vendor'}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: colors.primary }]}>
                      ₦{product.price.toLocaleString()}
                    </Text>
                    <Text
                      style={[styles.unit, { color: colors.textSecondary }]}
                    >
                      {product.unit}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionsColumn}>
                  <TouchableOpacity
                    onPress={(e) => handleWishlistToggle(product.id, e)}
                    style={[
                      styles.wishlistButton,
                      { backgroundColor: colors.filter },
                    ]}
                  >
                    <Heart
                      size={18}
                      color={
                        isInWishlist(product.id)
                          ? colors.error
                          : colors.textSecondary
                      }
                      fill={
                        isInWishlist(product.id) ? colors.error : 'transparent'
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      { backgroundColor: colors.secondary },
                    ]}
                    onPress={(e) => handleAddToCart(product, e)}
                  >
                    <Text
                      style={[
                        styles.addButtonText,
                        { color: colors.buttonText },
                      ]}
                    >
                      Add
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <View style={styles.sheetContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Filters
            </Text>
          </View>

          <BottomSheetScrollView showsVerticalScrollIndicator={false}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Category
              </Text>
              <View style={styles.filterOptions}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      { borderColor: colors.border },
                      (category === 'All'
                        ? !filters.category
                        : filters.category === category) && {
                        backgroundColor: colors.secondary,
                        borderColor: colors.secondary,
                      },
                    ]}
                    onPress={() => handleCategoryFilter(category)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: colors.text },
                        (category === 'All'
                          ? !filters.category
                          : filters.category === category) && {
                          color: colors.buttonText,
                        },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Sort By
              </Text>
              <View style={styles.filterOptions}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      { borderColor: colors.border },
                      (filters.sortBy === option.value ||
                        (!filters.sortBy && option.value === 'recent')) && {
                        backgroundColor: colors.secondary,
                        borderColor: colors.secondary,
                      },
                    ]}
                    onPress={() => handleSortChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: colors.text },
                        (filters.sortBy === option.value ||
                          (!filters.sortBy && option.value === 'recent')) && {
                          color: colors.buttonText,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Price Range
              </Text>
              <View style={styles.priceInputs}>
                <TextInput
                  style={[
                    styles.priceInput,
                    { backgroundColor: colors.filter, color: colors.text },
                  ]}
                  placeholder="Min"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={filters.minPrice?.toString() || ''}
                  onChangeText={(text) =>
                    setFilters({ minPrice: text ? parseFloat(text) : null })
                  }
                />
                <Text
                  style={[
                    styles.priceSeparator,
                    { color: colors.textSecondary },
                  ]}
                >
                  to
                </Text>
                <TextInput
                  style={[
                    styles.priceInput,
                    { backgroundColor: colors.filter, color: colors.text },
                  ]}
                  placeholder="Max"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={filters.maxPrice?.toString() || ''}
                  onChangeText={(text) =>
                    setFilters({ maxPrice: text ? parseFloat(text) : null })
                  }
                />
              </View>
            </View>
          </BottomSheetScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: colors.border }]}
              onPress={handleClearFilters}
            >
              <Text style={[styles.clearButtonText, { color: colors.text }]}>
                Clear All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.applyButton,
                { backgroundColor: colors.secondary },
              ]}
              onPress={() => bottomSheetRef.current?.close()}
            >
              <Text
                style={[styles.applyButtonText, { color: colors.buttonText }]}
              >
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
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
  },
  filterButton: {
    padding: 4,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentSearches: {
    gap: 12,
  },
  recentSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recentSearchText: {
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
  resultCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultFarmer: {
    fontSize: 14,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 12,
    marginLeft: 4,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
  },
  addButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionsColumn: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  wishlistButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContent: {
    flex: 1,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  priceSeparator: {
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
