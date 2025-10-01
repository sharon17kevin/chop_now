import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Star, ShoppingCart } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const categories = [
  { id: 1, name: 'Fruits', icon: '🍎', color: '#EF4444' },
  { id: 2, name: 'Vegetables', icon: '🥕', color: '#059669' },
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
    image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: '2.5 miles away',
  },
  {
    id: 2,
    name: 'Fresh Strawberries',
    price: 6.99,
    unit: 'per basket',
    farmer: 'Berry Fields',
    rating: 4.9,
    image: 'https://images.pexels.com/photos/46174/strawberries-berries-fruit-freshness-46174.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: '1.8 miles away',
  },
  {
    id: 3,
    name: 'Farm Fresh Eggs',
    price: 5.49,
    unit: 'per dozen',
    farmer: 'Sunny Side Farm',
    rating: 4.7,
    image: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: '3.2 miles away',
  },
];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color="#059669" />
              <Text style={styles.location}>San Francisco, CA</Text>
            </View>
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

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={{
              uri: 'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg?auto=compress&cs=tinysrgb&w=800',
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Fresh From Farm to Table</Text>
            <Text style={styles.heroSubtitle}>
              Support local farmers and get the freshest produce delivered
            </Text>
            <TouchableOpacity style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsContainer}>
            {featuredProducts.map((product) => (
              <TouchableOpacity key={product.id} style={styles.productCard}>
                <Image source={{ uri: product.image }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.farmerName}>{product.farmer}</Text>
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#FCD34D" fill="#FCD34D" />
                    <Text style={styles.rating}>{product.rating}</Text>
                    <Text style={styles.location}>• {product.location}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>${product.price}</Text>
                    <Text style={styles.unit}>{product.unit}</Text>
                  </View>
                  <TouchableOpacity style={styles.addToCartButton}>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Farmers Near You */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farmers Near You</Text>
          <View style={styles.farmersList}>
            <TouchableOpacity style={styles.farmerCard}>
              <Image
                source={{
                  uri: 'https://images.pexels.com/photos/2889942/pexels-photo-2889942.jpeg?auto=compress&cs=tinysrgb&w=400',
                }}
                style={styles.farmerImage}
              />
              <View style={styles.farmerInfo}>
                <Text style={styles.farmerName}>Green Valley Farm</Text>
                <Text style={styles.farmerDescription}>Organic vegetables and fruits</Text>
                <View style={styles.ratingRow}>
                  <Star size={12} color="#FCD34D" fill="#FCD34D" />
                  <Text style={styles.rating}>4.8</Text>
                  <Text style={styles.location}>• 2.5 miles away</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingVertical: 12,
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
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
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
    paddingHorizontal: 20,
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
    width: width * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  farmersList: {
    paddingHorizontal: 20,
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