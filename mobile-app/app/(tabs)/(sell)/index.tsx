import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  Plus,
  MapPin,
  DollarSign,
  X,
  Package,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { uploadMultipleImages, validateImage } from '@/lib/uploadService';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const router = useRouter();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [isOrganic, setIsOrganic] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch pending orders count for badge
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-orders-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', user.id)
        .eq('status', 'pending');
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: locationStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera and photo library access is needed to upload product images.',
      );
      return false;
    }

    return true;
  };

  const pickImageFromCamera = async () => {
    if (images.length >= 5) {
      Alert.alert(
        'Limit Reached',
        'You can upload a maximum of 5 images per product.',
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const validation = await validateImage(result.assets[0].uri);
        if (!validation.valid) {
          Alert.alert(
            'Invalid Image',
            validation.error || 'Image validation failed',
          );
          return;
        }
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const pickImageFromLibrary = async () => {
    if (images.length >= 5) {
      Alert.alert(
        'Limit Reached',
        'You can upload a maximum of 5 images per product.',
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
      });

      if (!result.canceled) {
        const newImages: string[] = [];
        for (const asset of result.assets) {
          const validation = await validateImage(asset.uri);
          if (validation.valid) {
            newImages.push(asset.uri);
          } else {
            Alert.alert(
              'Invalid Image',
              validation.error || 'One or more images failed validation',
            );
          }
        }
        setImages([...images, ...newImages].slice(0, 5));
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location access is needed to set product location.',
        );
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      });

      setLocation({
        lat: locationResult.coords.latitude,
        lng: locationResult.coords.longitude,
        address: address[0]
          ? `${address[0].city}, ${address[0].region}`
          : 'Unknown',
      });

      Alert.alert('Success', 'Location captured successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    if (!productName.trim()) {
      Alert.alert('Missing Information', 'Please enter a product name.');
      return false;
    }
    if (!selectedCategory) {
      Alert.alert('Missing Information', 'Please select a category.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please enter a product description.');
      return false;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return false;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return false;
    }
    if (images.length === 0) {
      Alert.alert('Missing Images', 'Please add at least one product image.');
      return false;
    }
    if (!location) {
      Alert.alert('Missing Location', 'Please capture your location.');
      return false;
    }
    return true;
  };

  const handlePublishProduct = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('Authentication Error', 'Please log in to publish products.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload images
      const uploadedImages = await uploadMultipleImages(
        images,
        user.id,
        'product-images',
        (current, total) => {
          setUploadProgress((current / total) * 100);
        },
      );

      const imageUrls = uploadedImages.map((img) => img.url);

      // Insert product into database
      const { data, error } = await supabase
        .from('products')
        .insert({
          vendor_id: user.id,
          name: productName.trim(),
          description: description.trim(),
          price: parseFloat(price),
          category: selectedCategory.toLowerCase(),
          stock: parseInt(quantity),
          unit: unit,
          images: imageUrls,
          image_url: imageUrls[0], // Backwards compatibility
          location: location,
          is_organic: isOrganic,
          status: 'pending', // Requires admin approval
          is_available: true,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success! 🎉',
        'Your product has been submitted for review. You will be notified once it is approved.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setProductName('');
              setDescription('');
              setPrice('');
              setSelectedCategory('');
              setQuantity('');
              setImages([]);
              setLocation(null);
              setIsOrganic(false);
            },
          },
        ],
      );
    } catch (error: any) {
      console.error('Error publishing product:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to publish product. Please try again.',
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Product Image',
      'Choose image source',
      [
        { text: 'Camera', onPress: pickImageFromCamera },
        { text: 'Photo Library', onPress: pickImageFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              Sell Your Produce
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Share your fresh products with the community
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/(sell)/orders')}
            >
              <Package size={18} color="#fff" />
              <Text style={styles.headerButtonText}>Orders</Text>
              {pendingCount && pendingCount > 0 ? (
                <View style={styles.buttonBadge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerButton,
                { backgroundColor: colors.secondary },
              ]}
              onPress={() => router.push('/(tabs)/(sell)/stock')}
            >
              <Package size={18} color="#fff" />
              <Text style={styles.headerButtonText}>Stock</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Product Images */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Product Images ({images.length}/5)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesContainer}
            >
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={[
                      styles.removeImageButton,
                      { backgroundColor: colors.error },
                    ]}
                    onPress={() => removeImage(index)}
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity
                  style={[
                    styles.addImageButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={showImageOptions}
                >
                  <Camera size={24} color={colors.textSecondary} />
                  <Text
                    style={[
                      styles.addImageText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Add Photo
                  </Text>
                </TouchableOpacity>
              )}
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
              <Text style={[styles.label, { color: colors.text }]}>
                Category
              </Text>
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
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <DollarSign size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.priceInputField, { color: colors.text }]}
                    placeholder="0.00"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Quantity
                </Text>
                <View style={styles.quantityRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.quantityInput,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="50"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.unitInput,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="kg"
                    value={unit}
                    onChangeText={setUnit}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            </View>

            {/* Organic Toggle */}
            <TouchableOpacity
              style={[
                styles.organicToggle,
                { backgroundColor: colors.card, borderColor: colors.border },
                isOrganic && {
                  backgroundColor: colors.success + '20',
                  borderColor: colors.success,
                },
              ]}
              onPress={() => setIsOrganic(!isOrganic)}
            >
              <View style={styles.organicToggleContent}>
                <Text
                  style={[
                    styles.label,
                    { color: colors.text, marginBottom: 0 },
                  ]}
                >
                  Organic Product
                </Text>
                <Text
                  style={[
                    styles.organicSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  Certified organic or pesticide-free
                </Text>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: colors.border },
                  isOrganic && { backgroundColor: colors.success },
                ]}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    { backgroundColor: colors.card },
                    isOrganic && styles.toggleCircleActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
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
                location && {
                  backgroundColor: colors.success + '20',
                  borderColor: colors.success,
                },
              ]}
              onPress={getCurrentLocation}
            >
              <MapPin
                size={20}
                color={location ? colors.success : colors.textSecondary}
              />
              <Text
                style={[
                  styles.locationText,
                  { color: location ? colors.success : colors.textSecondary },
                ]}
              >
                {location ? location.address : 'Use Current Location'}
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
              {images.length > 0 ? (
                <Image
                  source={{ uri: images[0] }}
                  style={styles.previewImage}
                />
              ) : (
                <View
                  style={[
                    styles.previewImagePlaceholder,
                    { backgroundColor: colors.filter },
                  ]}
                >
                  <Camera size={32} color={colors.textSecondary} />
                </View>
              )}
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
                  {selectedCategory || 'Category'} {isOrganic && '🌱'}
                </Text>
                <Text style={[styles.previewPrice, { color: colors.success }]}>
                  ${price || '0.00'}/{unit}
                </Text>
                {location && (
                  <Text
                    style={[
                      styles.previewLocation,
                      { color: colors.textSecondary },
                    ]}
                  >
                    📍 {location.address}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Publish Button */}
          <View style={styles.publishSection}>
            <TouchableOpacity
              style={[
                styles.publishButton,
                { backgroundColor: colors.success },
                isUploading && { opacity: 0.7 },
              ]}
              onPress={handlePublishProduct}
              disabled={isUploading}
            >
              {isUploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator color={colors.buttonText} size="small" />
                  <Text
                    style={[
                      styles.publishButtonText,
                      { color: colors.buttonText, marginLeft: 8 },
                    ]}
                  >
                    Uploading... {Math.round(uploadProgress)}%
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.publishButtonText,
                    { color: colors.buttonText },
                  ]}
                >
                  Publish Product
                </Text>
              )}
            </TouchableOpacity>
            <Text style={[styles.publishNote, { color: colors.textSecondary }]}>
              Your product will be reviewed and published within 24 hours
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerContent: {
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonBadge: {
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  ordersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    flexShrink: 0,
  },
  ordersButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  ordersBadge: {
    backgroundColor: '#FF3B30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 6,
  },
  ordersBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
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
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  uploadedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  quantityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityInput: {
    flex: 2,
  },
  unitInput: {
    flex: 1,
  },
  organicToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  organicToggleContent: {
    flex: 1,
  },
  organicSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleCircleActive: {
    transform: [{ translateX: 22 }],
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
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
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
  previewLocation: {
    fontSize: 12,
    marginTop: 4,
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
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
