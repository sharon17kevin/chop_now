import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Plus, MapPin, DollarSign } from 'lucide-react-native';

const categories = ['Fruits', 'Vegetables', 'Dairy', 'Grains', 'Herbs', 'Other'];

export default function SellScreen() {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [quantity, setQuantity] = useState('');

  const handlePublishProduct = () => {
    // Handle product publication logic here
    console.log('Publishing product:', {
      productName,
      description,
      price,
      selectedCategory,
      quantity,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sell Your Produce</Text>
        <Text style={styles.subtitle}>Share your fresh products with the community</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
            <TouchableOpacity style={styles.addImageButton}>
              <Camera size={24} color="#6B7280" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addImageButton}>
              <Plus size={24} color="#6B7280" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Organic Tomatoes"
              value={productName}
              onChangeText={setProductName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoriesRow}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category && styles.selectedCategoryChip,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === category && styles.selectedCategoryChipText,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell customers about your product..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Pricing & Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing & Quantity</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Price per Unit</Text>
              <View style={styles.priceInput}>
                <DollarSign size={16} color="#6B7280" />
                <TextInput
                  style={styles.priceInputField}
                  placeholder="0.00"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Available Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 50 lbs"
                value={quantity}
                onChangeText={setQuantity}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity style={styles.locationButton}>
            <MapPin size={20} color="#059669" />
            <Text style={styles.locationText}>Use Current Location</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewImagePlaceholder}>
              <Camera size={32} color="#9CA3AF" />
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewName}>{productName || 'Product Name'}</Text>
              <Text style={styles.previewCategory}>{selectedCategory || 'Category'}</Text>
              <Text style={styles.previewPrice}>${price || '0.00'}</Text>
            </View>
          </View>
        </View>

        {/* Publish Button */}
        <View style={styles.publishSection}>
          <TouchableOpacity style={styles.publishButton} onPress={handlePublishProduct}>
            <Text style={styles.publishButtonText}>Publish Product</Text>
          </TouchableOpacity>
          <Text style={styles.publishNote}>
            Your product will be reviewed and published within 24 hours
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
  },
  addImageButton: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addImageText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryChip: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceInputField: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationText: {
    fontSize: 16,
    color: '#059669',
    marginLeft: 8,
  },
  previewCard: {
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
  previewImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  previewCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  publishSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  publishButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  publishNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});