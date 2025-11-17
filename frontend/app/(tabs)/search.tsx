import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Star } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const searchResults = [
  {
    id: 1,
    name: 'Organic Apples',
    price: 3.99,
    unit: 'per lb',
    farmer: 'Orchard Hills',
    rating: 4.6,
    image:
      'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    name: 'Baby Spinach',
    price: 2.49,
    unit: 'per bag',
    farmer: 'Green Leaf Farm',
    rating: 4.8,
    image:
      'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 3,
    name: 'Sweet Corn',
    price: 1.99,
    unit: 'per ear',
    farmer: 'Sunny Acres',
    rating: 4.7,
    image:
      'https://images.pexels.com/photos/547263/pexels-photo-547263.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

const popularSearches = [
  'Organic tomatoes',
  'Fresh berries',
  'Local honey',
  'Free-range eggs',
  'Seasonal vegetables',
];

export default function SearchScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
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
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={colors.success} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!isSearching ? (
          <>
            {/* Popular Searches */}
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

            {/* Recent Searches */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Searches
              </Text>
              <View style={styles.recentSearches}>
                <TouchableOpacity style={styles.recentSearchItem}>
                  <Search size={16} color={colors.textSecondary} />
                  <Text
                    style={[
                      styles.recentSearchText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    organic carrots
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.recentSearchItem}>
                  <Search size={16} color={colors.textSecondary} />
                  <Text
                    style={[
                      styles.recentSearchText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    farm fresh milk
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          // Search Results
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Results for &quot;{searchQuery}&quot; ({searchResults.length})
            </Text>
            {searchResults.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.resultCard,
                  { backgroundColor: colors.card, shadowColor: colors.text },
                ]}
              >
                <Image
                  source={{ uri: product.image }}
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
                    {product.farmer}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#FCD34D" fill="#FCD34D" />
                    <Text style={[styles.rating, { color: colors.text }]}>
                      {product.rating}
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: colors.success }]}>
                      ${product.price}
                    </Text>
                    <Text
                      style={[styles.unit, { color: colors.textSecondary }]}
                    >
                      {product.unit}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Text
                    style={[styles.addButtonText, { color: colors.buttonText }]}
                  >
                    Add
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
  recentSearches: {
    gap: 12,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentSearchText: {
    fontSize: 16,
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
});
