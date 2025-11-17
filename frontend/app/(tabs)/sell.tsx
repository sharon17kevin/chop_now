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
import { useTheme } from '@/hooks/useTheme';

const categories = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Grains',
  'Herbs',
  'Other',
];

export default function SellScreen() {
  const { colors } = useTheme();
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Sell Your Produce
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Share your fresh products with the community
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Product Images
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesContainer}
          >
            <TouchableOpacity
              style={[
                styles.addImageButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Camera size={24} color={colors.textSecondary} />
              <Text
                style={[styles.addImageText, { color: colors.textSecondary }]}
              >
                Add Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.addImageButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Plus size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Product Details
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Product Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g., Organic Tomatoes"
              value={productName}
              onChangeText={setProductName}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoriesRow}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      selectedCategory === category && [
                        styles.selectedCategoryChip,
                        {
                          backgroundColor: colors.success,
                          borderColor: colors.success,
                        },
                      ],
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: colors.text },
                        selectedCategory === category && [
                          styles.selectedCategoryChipText,
                          { color: colors.buttonText },
                        ],
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
            <Text style={[styles.label, { color: colors.text }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Tell customers about your product..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Pricing & Quantity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Pricing & Quantity
          </Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Price per Unit
              </Text>
              <View
                style={[
                  styles.priceInput,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <DollarSign size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.priceInputField, { color: colors.text }]}
                  placeholder="0.00"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Available Quantity
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g., 50 lbs"
                value={quantity}
                onChangeText={setQuantity}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Location
          </Text>
          <TouchableOpacity
            style={[
              styles.locationButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <MapPin size={20} color={colors.success} />
            <Text style={[styles.locationText, { color: colors.success }]}>
              Use Current Location
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Preview
          </Text>
          <View
            style={[
              styles.previewCard,
              { backgroundColor: colors.card, shadowColor: colors.text },
            ]}
          >
            <View
              style={[
                styles.previewImagePlaceholder,
                { backgroundColor: colors.filter },
              ]}
            >
              <Camera size={32} color={colors.textSecondary} />
            </View>
            <View style={styles.previewContent}>
              <Text style={[styles.previewName, { color: colors.text }]}>
                {productName || 'Product Name'}
              </Text>
              <Text
                style={[
                  styles.previewCategory,
                  { color: colors.textSecondary },
                ]}
              >
                {selectedCategory || 'Category'}
              </Text>
              <Text style={[styles.previewPrice, { color: colors.success }]}>
                ${price || '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Publish Button */}
        <View style={styles.publishSection}>
          <TouchableOpacity
            style={[styles.publishButton, { backgroundColor: colors.success }]}
            onPress={handlePublishProduct}
          >
            <Text
              style={[styles.publishButtonText, { color: colors.buttonText }]}
            >
              Publish Product
            </Text>
          </TouchableOpacity>
          <Text style={[styles.publishNote, { color: colors.textSecondary }]}>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
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
  imagesContainer: {
    flexDirection: 'row',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addImageText: {
    fontSize: 14,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectedCategoryChip: {},
  categoryChipText: {
    fontSize: 14,
  },
  selectedCategoryChipText: {},
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  priceInputField: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationText: {
    fontSize: 16,
    marginLeft: 8,
  },
  previewCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  previewImagePlaceholder: {
    width: 80,
    height: 80,
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
    marginBottom: 4,
  },
  previewCategory: {
    fontSize: 14,
    marginBottom: 8,
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  publishSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  publishButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  publishNote: {
    fontSize: 14,
    textAlign: 'center',
  },
});
