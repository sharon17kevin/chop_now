import React, { useState, useEffect, useRef } from 'react';
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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  X,
  Package,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Save,
  Send,
  ImagePlus,
  Leaf,
  Info,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { OrderService } from '@/services/orders';
import { ProductService } from '@/services/products';
import { uploadMultipleImages, validateImage } from '@/lib/uploadService';
import { useAuth } from '@/hooks/useAuth';
import { useForm, Controller } from 'react-hook-form';
import { useDraftStore } from '@/stores/useDraftStore';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORIES = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Grains',
  'Herbs',
  'Other',
];

const UNITS = ['kg', 'g', 'lb', 'bunch', 'piece', 'dozen', 'crate', 'bag'];

interface ProductFormData {
  name: string;
  category: string;
  price: string;
  quantity: string;
  unit: string;
  description: string;
  isOrganic: boolean;
  minimumOrderQty: string;
  hasIncrement: boolean;
  orderIncrement: string;
  hasBulkDiscount: boolean;
  discountTier1Qty: string;
  discountTier1Percent: string;
  discountTier2Qty: string;
  discountTier2Percent: string;
}

// --- Collapsible Section Component ---
function CollapsibleSection({
  title,
  subtitle,
  expanded,
  onToggle,
  colors,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  colors: any;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.sectionHeaderRight}>
          {badge && (
            <View
              style={[
                styles.sectionBadge,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Text
                style={[styles.sectionBadgeText, { color: colors.primary }]}
              >
                {badge}
              </Text>
            </View>
          )}
          {expanded ? (
            <ChevronUp size={20} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={20} color={colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

// --- Inline Error Component ---
function FieldError({ message }: { message?: string }) {
  const { colors } = useTheme();
  if (!message) return null;
  return (
    <Text style={[styles.fieldError, { color: colors.error }]}>{message}</Text>
  );
}

export default function SellScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  // Sections state
  const [photosExpanded, setPhotosExpanded] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [locationExpanded, setLocationExpanded] = useState(false);

  // Images and location (not part of react-hook-form since they're not text inputs)
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Draft store
  const {
    draft,
    setDraft,
    saveDraftToStorage,
    loadDraftFromStorage,
    clearDraft,
    loadSmartDefaults,
    saveSmartDefaults,
    smartDefaults,
    hasDraft,
  } = useDraftStore();

  // Auto-save timer
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef(0);

  // React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      category: '',
      price: '',
      quantity: '',
      unit: 'kg',
      description: '',
      isOrganic: false,
      minimumOrderQty: '1',
      hasIncrement: false,
      orderIncrement: '1',
      hasBulkDiscount: false,
      discountTier1Qty: '',
      discountTier1Percent: '',
      discountTier2Qty: '',
      discountTier2Percent: '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const hasIncrement = watch('hasIncrement');
  const hasBulkDiscount = watch('hasBulkDiscount');
  const unit = watch('unit');
  const quantity = watch('quantity');
  const minimumOrderQty = watch('minimumOrderQty');
  const orderIncrement = watch('orderIncrement');
  const discountTier1Qty = watch('discountTier1Qty');
  const discountTier1Percent = watch('discountTier1Percent');

  // Fetch pending orders count for badge
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-orders-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return OrderService.getVendorPendingCount(user.id);
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Load draft and smart defaults on mount
  useEffect(() => {
    (async () => {
      await loadDraftFromStorage();
      await loadSmartDefaults();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply loaded draft to form
  useEffect(() => {
    if (draft.updatedAt > 0) {
      setValue('name', draft.name);
      setValue('category', draft.category);
      setValue('price', draft.price);
      setValue('quantity', draft.quantity);
      setValue('unit', draft.unit || 'kg');
      setValue('description', draft.description);
      setValue('isOrganic', draft.isOrganic);
      setValue('minimumOrderQty', draft.minimumOrderQty || '1');
      setValue('hasIncrement', draft.hasIncrement);
      setValue('orderIncrement', draft.orderIncrement || '1');
      setValue('hasBulkDiscount', draft.hasBulkDiscount || false);
      setValue('discountTier1Qty', draft.discountTier1Qty || '');
      setValue('discountTier1Percent', draft.discountTier1Percent || '');
      setValue('discountTier2Qty', draft.discountTier2Qty || '');
      setValue('discountTier2Percent', draft.discountTier2Percent || '');
      setImages(draft.images || []);
      setLocation(draft.location || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.updatedAt]);

  // Apply smart defaults for fresh forms
  useEffect(() => {
    if (smartDefaults && !hasDraft) {
      if (smartDefaults.unit) setValue('unit', smartDefaults.unit);
      if (smartDefaults.category) setValue('category', smartDefaults.category);
      if (smartDefaults.location) setLocation(smartDefaults.location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smartDefaults, hasDraft]);

  // Sync form values to draft store (for auto-save)
  useEffect(() => {
    setDraft({
      name: watchedValues.name,
      category: watchedValues.category,
      price: watchedValues.price,
      quantity: watchedValues.quantity,
      unit: watchedValues.unit,
      description: watchedValues.description,
      isOrganic: watchedValues.isOrganic,
      minimumOrderQty: watchedValues.minimumOrderQty,
      hasIncrement: watchedValues.hasIncrement,
      orderIncrement: watchedValues.orderIncrement,
      hasBulkDiscount: watchedValues.hasBulkDiscount,
      discountTier1Qty: watchedValues.discountTier1Qty,
      discountTier1Percent: watchedValues.discountTier1Percent,
      discountTier2Qty: watchedValues.discountTier2Qty,
      discountTier2Percent: watchedValues.discountTier2Percent,
      images,
      location,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedValues.name,
    watchedValues.category,
    watchedValues.price,
    watchedValues.quantity,
    watchedValues.unit,
    watchedValues.description,
    watchedValues.isOrganic,
    watchedValues.minimumOrderQty,
    watchedValues.hasIncrement,
    watchedValues.orderIncrement,
    images,
    location,
  ]);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      const now = Date.now();
      if (now - lastSavedRef.current > 29000) {
        saveDraftToStorage();
        lastSavedRef.current = now;
      }
    }, 30000);
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Image Handling ---
  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      Alert.alert('Limit Reached', 'Maximum 5 images per product.');
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
        setImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const pickImageFromLibrary = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 images per product.');
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
        setImages((prev) => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    Alert.alert('Add Product Image', 'Choose image source', [
      { text: 'Camera', onPress: pickImageFromCamera },
      { text: 'Photo Library', onPress: pickImageFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // --- Location ---
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
      const loc = {
        lat: locationResult.coords.latitude,
        lng: locationResult.coords.longitude,
        address: address[0]
          ? `${address[0].city}, ${address[0].region}`
          : 'Unknown',
      };
      setLocation(loc);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    }
  };

  // --- Example quantities preview ---
  const getExampleQuantities = (): string => {
    const min = parseInt(minimumOrderQty) || 1;
    const inc = hasIncrement ? parseInt(orderIncrement) || 1 : 1;
    const stock = parseInt(quantity) || 0;
    if (stock === 0) return 'Set stock first';
    const examples: number[] = [];
    let current = min;
    while (examples.length < 5 && current <= stock) {
      examples.push(current);
      current += inc;
    }
    if (examples.length === 0) return 'Invalid configuration';
    const exampleStr = examples.map((q) => `${q}`).join(', ');
    return current <= stock ? `${exampleStr}...` : exampleStr;
  };

  // --- Progress calculation ---
  const getCompletionPercent = (): number => {
    let filled = 0;
    const total = 7;
    if (watchedValues.name.trim()) filled++;
    if (watchedValues.category) filled++;
    if (watchedValues.price && parseFloat(watchedValues.price) > 0) filled++;
    if (watchedValues.quantity && parseInt(watchedValues.quantity) > 0)
      filled++;
    if (images.length > 0) filled++;
    if (location) filled++;
    if (watchedValues.description.trim()) filled++;
    return Math.round((filled / total) * 100);
  };

  // --- Save as Draft ---
  const handleSaveDraft = async () => {
    await saveDraftToStorage();
    Alert.alert(
      'Draft Saved',
      'Your product listing has been saved as a draft.',
    );
  };

  // --- Toggle section with animation ---
  const toggleSection = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter((prev) => !prev);
  };

  // --- Publish ---
  const onPublish = async (data: ProductFormData) => {
    // Extra validations for non-form fields
    if (images.length === 0) {
      setPhotosExpanded(true);
      Alert.alert('Missing Images', 'Please add at least one product image.');
      return;
    }
    if (!location) {
      setLocationExpanded(true);
      Alert.alert('Missing Location', 'Please capture your location.');
      return;
    }

    // Ordering rules validation
    const min = parseInt(data.minimumOrderQty) || 1;
    const stock = parseInt(data.quantity) || 0;
    const inc = parseInt(data.orderIncrement) || 1;
    if (min > stock) {
      Alert.alert(
        'Invalid Minimum',
        'Minimum order quantity cannot exceed available stock.',
      );
      return;
    }
    if (data.hasIncrement && inc < 1) {
      Alert.alert('Invalid Increment', 'Order increment must be at least 1.');
      return;
    }
    if (data.hasIncrement && inc > min) {
      Alert.alert(
        'Invalid Increment',
        'Order increment cannot be larger than minimum order quantity.',
      );
      return;
    }
    if (data.hasIncrement && min % inc !== 0) {
      Alert.alert(
        'Invalid Configuration',
        'Minimum order quantity should be divisible by the increment.',
      );
      return;
    }

    if (!user?.id) {
      Alert.alert('Authentication Error', 'Please log in to publish products.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedImages = await uploadMultipleImages(
        images,
        user.id,
        'product-images',
        (current, total) => setUploadProgress((current / total) * 100),
      );
      const imageUrls = uploadedImages.map((img) => img.url);

      // Build bulk discount tiers array
      const bulkDiscountTiers: {
        min_quantity: number;
        discount_percent: number;
      }[] = [];
      if (
        data.hasBulkDiscount &&
        data.discountTier1Qty &&
        data.discountTier1Percent
      ) {
        bulkDiscountTiers.push({
          min_quantity: parseInt(data.discountTier1Qty),
          discount_percent: parseFloat(data.discountTier1Percent),
        });

        // Add tier 2 if both fields are filled
        if (data.discountTier2Qty && data.discountTier2Percent) {
          bulkDiscountTiers.push({
            min_quantity: parseInt(data.discountTier2Qty),
            discount_percent: parseFloat(data.discountTier2Percent),
          });
        }
      }

      await ProductService.addProduct({
        vendor_id: user.id,
        name: data.name.trim(),
        description: data.description.trim(),
        price: parseFloat(data.price),
        category: data.category.toLowerCase(),
        stock: parseInt(data.quantity),
        unit: data.unit,
        images: imageUrls,
        image_url: imageUrls[0],
        location,
        is_organic: data.isOrganic,
        status: 'pending',
        is_available: true,
        minimum_order_quantity: parseInt(data.minimumOrderQty) || 1,
        order_increment: data.hasIncrement
          ? parseInt(data.orderIncrement)
          : null,
        bulk_discount_tiers:
          bulkDiscountTiers.length > 0 ? bulkDiscountTiers : null,
      });

      // Save smart defaults for next product
      await saveSmartDefaults({
        unit: data.unit,
        category: data.category,
        location,
      });

      // Clear draft
      await clearDraft();

      setShowSuccess(true);
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

  // --- Success state ---
  const handleAddAnother = () => {
    reset({
      name: '',
      category: smartDefaults?.category || '',
      price: '',
      quantity: '',
      unit: smartDefaults?.unit || 'kg',
      description: '',
      isOrganic: false,
      minimumOrderQty: '1',
      hasIncrement: false,
      orderIncrement: '1',
      hasBulkDiscount: false,
      discountTier1Qty: '',
      discountTier1Percent: '',
      discountTier2Qty: '',
      discountTier2Percent: '',
    });
    setImages([]);
    if (smartDefaults?.location) {
      setLocation(smartDefaults.location);
    } else {
      setLocation(null);
    }
    setShowSuccess(false);
    setPhotosExpanded(false);
    setDetailsExpanded(false);
    setLocationExpanded(false);
  };

  if (showSuccess) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.successContainer}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.successIcon,
                { backgroundColor: colors.success + '20' },
              ]}
            >
              <Send size={32} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Product Submitted!
            </Text>
            <Text
              style={[styles.successSubtitle, { color: colors.textSecondary }]}
            >
              Your product has been submitted for review. You&apos;ll be
              notified once it&apos;s approved.
            </Text>
            <TouchableOpacity
              style={[
                styles.successButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleAddAnother}
            >
              <Text
                style={[styles.successButtonText, { color: colors.buttonText }]}
              >
                Add Another Product
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.successButtonOutline,
                { borderColor: colors.border },
              ]}
              onPress={() => router.push('/(tabs)/(sell)/stock')}
            >
              <Text
                style={[
                  styles.successButtonOutlineText,
                  { color: colors.text },
                ]}
              >
                View My Products
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const completionPercent = getCompletionPercent();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.text }]}>
                New Product
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {completionPercent}% complete
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.success + '15' },
                ]}
                onPress={() => router.push('/(tabs)/(sell)/analytics')}
              >
                <BarChart3 size={18} color={colors.success} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.primary + '15' },
                ]}
                onPress={() => router.push('/(tabs)/(sell)/orders')}
              >
                <Package size={18} color={colors.primary} />
                {pendingCount && pendingCount > 0 ? (
                  <View style={styles.buttonBadge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.secondary + '15' },
                ]}
                onPress={() => router.push('/(tabs)/(sell)/stock')}
              >
                <Package size={18} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Progress bar */}
          <View
            style={[styles.progressBarBg, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${completionPercent}%`,
                  backgroundColor: colors.success,
                },
              ]}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* === Section 1: Product Basics (always visible) === */}
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Product Basics
              </Text>
            </View>
            <View style={styles.sectionContent}>
              {/* Product Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Product Name
                </Text>
                <Controller
                  control={control}
                  name="name"
                  rules={{ required: 'Product name is required' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.input,
                          borderColor: errors.name
                            ? colors.error
                            : colors.inputBorder,
                          color: colors.text,
                        },
                      ]}
                      placeholder="e.g., Organic Tomatoes"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
                <FieldError message={errors.name?.message} />
              </View>

              {/* Category chips */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Category
                </Text>
                <Controller
                  control={control}
                  name="category"
                  rules={{ required: 'Please select a category' }}
                  render={({ field: { onChange, value } }) => (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={styles.chipsRow}>
                        {CATEGORIES.map((cat) => (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: colors.input,
                                borderColor: errors.category
                                  ? colors.error
                                  : colors.inputBorder,
                              },
                              value === cat && {
                                backgroundColor: colors.success,
                                borderColor: colors.success,
                              },
                            ]}
                            onPress={() => onChange(cat)}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: colors.text },
                                value === cat && { color: colors.buttonText },
                              ]}
                            >
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                />
                <FieldError message={errors.category?.message} />
              </View>

              {/* Price & Quantity row */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Price per Unit (₦)
                  </Text>
                  <Controller
                    control={control}
                    name="price"
                    rules={{
                      required: 'Price is required',
                      validate: (v) =>
                        parseFloat(v) > 0 || 'Enter a valid price',
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.input,
                            borderColor: errors.price
                              ? colors.error
                              : colors.inputBorder,
                            color: colors.text,
                          },
                        ]}
                        placeholder="0.00"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="decimal-pad"
                        placeholderTextColor={colors.textSecondary}
                      />
                    )}
                  />
                  <FieldError message={errors.price?.message} />
                </View>

                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Stock
                  </Text>
                  <Controller
                    control={control}
                    name="quantity"
                    rules={{
                      required: 'Stock is required',
                      validate: (v) =>
                        parseInt(v) > 0 || 'Enter a valid quantity',
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.input,
                            borderColor: errors.quantity
                              ? colors.error
                              : colors.inputBorder,
                            color: colors.text,
                          },
                        ]}
                        placeholder="50"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                      />
                    )}
                  />
                  <FieldError message={errors.quantity?.message} />
                </View>
              </View>

              {/* Unit selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
                <Controller
                  control={control}
                  name="unit"
                  render={({ field: { onChange, value } }) => (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={styles.chipsRow}>
                        {UNITS.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: colors.input,
                                borderColor: colors.inputBorder,
                              },
                              value === u && {
                                backgroundColor: colors.primary,
                                borderColor: colors.primary,
                              },
                            ]}
                            onPress={() => onChange(u)}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: colors.text },
                                value === u && { color: colors.buttonText },
                              ]}
                            >
                              {u}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                />
              </View>

              {/* Minimum Order Qty */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Minimum Order Quantity
                </Text>
                <View style={styles.row}>
                  <Controller
                    control={control}
                    name="minimumOrderQty"
                    rules={{
                      validate: (v) => parseInt(v) >= 1 || 'Must be at least 1',
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          styles.smallInput,
                          {
                            backgroundColor: colors.input,
                            borderColor: errors.minimumOrderQty
                              ? colors.error
                              : colors.inputBorder,
                            color: colors.text,
                          },
                        ]}
                        placeholder="1"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                      />
                    )}
                  />
                  <Text
                    style={[styles.inlineHint, { color: colors.textSecondary }]}
                  >
                    {unit} (leave as 1 for no minimum)
                  </Text>
                </View>
                <FieldError message={errors.minimumOrderQty?.message} />
              </View>

              {/* Increment toggle */}
              <Controller
                control={control}
                name="hasIncrement"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    style={[
                      styles.toggleRow,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.inputBorder,
                      },
                      value && {
                        backgroundColor: colors.primary + '15',
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => onChange(!value)}
                  >
                    <View style={styles.toggleContent}>
                      <Info
                        size={18}
                        color={value ? colors.primary : colors.textSecondary}
                      />
                      <View style={styles.toggleTextWrap}>
                        <Text
                          style={[styles.toggleLabel, { color: colors.text }]}
                        >
                          Sold in specific increments
                        </Text>
                        <Text
                          style={[
                            styles.toggleSub,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Customers order in multiples of this amount
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.toggleSwitch,
                        { backgroundColor: colors.border },
                        value && { backgroundColor: colors.primary },
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleCircle,
                          { backgroundColor: colors.card },
                          value && styles.toggleCircleActive,
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              />

              {/* Increment value */}
              {hasIncrement && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Order Increment
                  </Text>
                  <View style={styles.row}>
                    <Controller
                      control={control}
                      name="orderIncrement"
                      rules={{
                        validate: (v) =>
                          parseInt(v) >= 1 || 'Must be at least 1',
                      }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={[
                            styles.input,
                            styles.smallInput,
                            {
                              backgroundColor: colors.input,
                              borderColor: errors.orderIncrement
                                ? colors.error
                                : colors.inputBorder,
                              color: colors.text,
                            },
                          ]}
                          placeholder="1"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="numeric"
                          placeholderTextColor={colors.textSecondary}
                        />
                      )}
                    />
                    <Text
                      style={[
                        styles.inlineHint,
                        { color: colors.textSecondary },
                      ]}
                    >
                      per step (e.g., 5, 10, 15...)
                    </Text>
                  </View>
                  <FieldError message={errors.orderIncrement?.message} />
                </View>
              )}

              {/* Quantity preview box */}
              {(parseInt(minimumOrderQty) > 1 || hasIncrement) && (
                <View
                  style={[
                    styles.previewBox,
                    {
                      backgroundColor: colors.primary + '10',
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[styles.previewBoxTitle, { color: colors.primary }]}
                  >
                    Customers can order:
                  </Text>
                  <Text style={[styles.previewBoxText, { color: colors.text }]}>
                    {getExampleQuantities()} {unit}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* === Section 2: Photos (collapsible) === */}
          <CollapsibleSection
            title="Photos"
            subtitle={
              images.length > 0
                ? `${images.length}/5 added`
                : 'Add product images'
            }
            expanded={photosExpanded}
            onToggle={() => toggleSection(setPhotosExpanded)}
            colors={colors}
            badge={images.length > 0 ? `${images.length}/5` : undefined}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScroll}
            >
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.uploadedImage} />
                  {index === 0 && (
                    <View
                      style={[
                        styles.primaryBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={styles.primaryBadgeText}>Main</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.removeImageButton,
                      { backgroundColor: colors.error },
                    ]}
                    onPress={() => removeImage(index)}
                  >
                    <X size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity
                  style={[
                    styles.addImageButton,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  onPress={showImageOptions}
                >
                  <ImagePlus size={24} color={colors.textSecondary} />
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
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              First image will be the main photo. Max 5 images.
            </Text>
          </CollapsibleSection>

          {/* === Section 3: Details (collapsible) === */}
          <CollapsibleSection
            title="Details"
            subtitle="Description, organic, bulk discounts"
            expanded={detailsExpanded}
            onToggle={() => toggleSection(setDetailsExpanded)}
            colors={colors}
          >
            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Description
              </Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Tell customers about your product..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor={colors.textSecondary}
                  />
                )}
              />
            </View>

            {/* Organic toggle */}
            <Controller
              control={control}
              name="isOrganic"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={[
                    styles.toggleRow,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                    },
                    value && {
                      backgroundColor: colors.success + '15',
                      borderColor: colors.success,
                    },
                  ]}
                  onPress={() => onChange(!value)}
                >
                  <View style={styles.toggleContent}>
                    <Leaf
                      size={18}
                      color={value ? colors.success : colors.textSecondary}
                    />
                    <View style={styles.toggleTextWrap}>
                      <Text
                        style={[styles.toggleLabel, { color: colors.text }]}
                      >
                        Organic Product
                      </Text>
                      <Text
                        style={[
                          styles.toggleSub,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Certified organic or pesticide-free
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.toggleSwitch,
                      { backgroundColor: colors.border },
                      value && { backgroundColor: colors.success },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleCircle,
                        { backgroundColor: colors.card },
                        value && styles.toggleCircleActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* Bulk Discount toggle */}
            <View style={{ marginTop: 16 }}>
              <Controller
                control={control}
                name="hasBulkDiscount"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    style={[
                      styles.toggleRow,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.inputBorder,
                      },
                      value && {
                        backgroundColor: colors.warning + '15',
                        borderColor: colors.warning,
                      },
                    ]}
                    onPress={() => onChange(!value)}
                  >
                    <View style={styles.toggleContent}>
                      <Package
                        size={18}
                        color={value ? colors.warning : colors.textSecondary}
                      />
                      <View style={styles.toggleTextWrap}>
                        <Text
                          style={[styles.toggleLabel, { color: colors.text }]}
                        >
                          Bulk Discounts
                        </Text>
                        <Text
                          style={[
                            styles.toggleSub,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Offer discounts for larger orders (up to 2 tiers)
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.toggleSwitch,
                        { backgroundColor: colors.border },
                        value && { backgroundColor: colors.warning },
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleCircle,
                          { backgroundColor: colors.card },
                          value && styles.toggleCircleActive,
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Discount Tier 1 */}
            {hasBulkDiscount && (
              <View style={{ marginTop: 16 }}>
                <Text
                  style={[
                    styles.label,
                    { color: colors.text, marginBottom: 8 },
                  ]}
                >
                  Discount Tier 1
                </Text>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.inputGroup,
                      styles.flex1,
                      { marginBottom: 0 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.label,
                        { color: colors.textSecondary, fontSize: 12 },
                      ]}
                    >
                      Min Quantity
                    </Text>
                    <Controller
                      control={control}
                      name="discountTier1Qty"
                      rules={{
                        validate: (v) =>
                          !hasBulkDiscount ||
                          !v ||
                          parseInt(v) > 0 ||
                          'Must be greater than 0',
                      }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.input,
                              borderColor: errors.discountTier1Qty
                                ? colors.error
                                : colors.inputBorder,
                              color: colors.text,
                            },
                          ]}
                          placeholder="10"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="numeric"
                          placeholderTextColor={colors.textSecondary}
                        />
                      )}
                    />
                  </View>

                  <View
                    style={[
                      styles.inputGroup,
                      styles.flex1,
                      { marginBottom: 0 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.label,
                        { color: colors.textSecondary, fontSize: 12 },
                      ]}
                    >
                      Discount %
                    </Text>
                    <Controller
                      control={control}
                      name="discountTier1Percent"
                      rules={{
                        validate: (v) =>
                          !hasBulkDiscount ||
                          !v ||
                          (parseFloat(v) > 0 && parseFloat(v) <= 100) ||
                          'Must be between 1-100',
                      }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.input,
                              borderColor: errors.discountTier1Percent
                                ? colors.error
                                : colors.inputBorder,
                              color: colors.text,
                            },
                          ]}
                          placeholder="10"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="decimal-pad"
                          placeholderTextColor={colors.textSecondary}
                        />
                      )}
                    />
                  </View>
                </View>
                {discountTier1Qty && discountTier1Percent && (
                  <Text
                    style={[
                      styles.helperText,
                      { color: colors.textSecondary, marginTop: 6 },
                    ]}
                  >
                    Buy {discountTier1Qty}+ {unit}, get {discountTier1Percent}%
                    off
                  </Text>
                )}
              </View>
            )}

            {/* Discount Tier 2 */}
            {hasBulkDiscount && discountTier1Qty && discountTier1Percent && (
              <View style={{ marginTop: 16 }}>
                <Text
                  style={[
                    styles.label,
                    { color: colors.text, marginBottom: 8 },
                  ]}
                >
                  Discount Tier 2 (Optional)
                </Text>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.inputGroup,
                      styles.flex1,
                      { marginBottom: 0 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.label,
                        { color: colors.textSecondary, fontSize: 12 },
                      ]}
                    >
                      Min Quantity
                    </Text>
                    <Controller
                      control={control}
                      name="discountTier2Qty"
                      rules={{
                        validate: (v) => {
                          if (!v) return true;
                          const tier1 = parseInt(discountTier1Qty) || 0;
                          const tier2 = parseInt(v) || 0;
                          return tier2 > tier1 || 'Must be greater than Tier 1';
                        },
                      }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.input,
                              borderColor: errors.discountTier2Qty
                                ? colors.error
                                : colors.inputBorder,
                              color: colors.text,
                            },
                          ]}
                          placeholder="50"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="numeric"
                          placeholderTextColor={colors.textSecondary}
                        />
                      )}
                    />
                  </View>

                  <View
                    style={[
                      styles.inputGroup,
                      styles.flex1,
                      { marginBottom: 0 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.label,
                        { color: colors.textSecondary, fontSize: 12 },
                      ]}
                    >
                      Discount %
                    </Text>
                    <Controller
                      control={control}
                      name="discountTier2Percent"
                      rules={{
                        validate: (v) => {
                          if (!v) return true;
                          const tier1Pct =
                            parseFloat(discountTier1Percent) || 0;
                          const tier2Pct = parseFloat(v) || 0;
                          if (tier2Pct <= 0 || tier2Pct > 100)
                            return 'Must be between 1-100';
                          return (
                            tier2Pct > tier1Pct ||
                            'Must be greater than Tier 1 discount'
                          );
                        },
                      }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.input,
                              borderColor: errors.discountTier2Percent
                                ? colors.error
                                : colors.inputBorder,
                              color: colors.text,
                            },
                          ]}
                          placeholder="20"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="decimal-pad"
                          placeholderTextColor={colors.textSecondary}
                        />
                      )}
                    />
                  </View>
                </View>
                <FieldError message={errors.discountTier2Qty?.message} />
                <FieldError message={errors.discountTier2Percent?.message} />
              </View>
            )}
          </CollapsibleSection>

          {/* === Section 4: Location (collapsible) === */}
          <CollapsibleSection
            title="Location"
            subtitle={location ? location.address : 'Set pickup location'}
            expanded={locationExpanded}
            onToggle={() => toggleSection(setLocationExpanded)}
            colors={colors}
            badge={location ? 'Set' : undefined}
          >
            <TouchableOpacity
              style={[
                styles.locationButton,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                },
                location && {
                  backgroundColor: colors.success + '15',
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
            {location &&
              smartDefaults?.location &&
              location.address !== smartDefaults.location.address && (
                <TouchableOpacity
                  style={[
                    styles.savedLocationButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setLocation(smartDefaults.location)}
                >
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text
                    style={[
                      styles.savedLocationText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Use last location: {smartDefaults.location.address}
                  </Text>
                </TouchableOpacity>
              )}
          </CollapsibleSection>

          {/* Bottom spacer for sticky bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* === Sticky Bottom Bar === */}
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.draftButton, { borderColor: colors.border }]}
            onPress={handleSaveDraft}
            disabled={isUploading}
          >
            <Save size={18} color={colors.textSecondary} />
            <Text style={[styles.draftButtonText, { color: colors.text }]}>
              Save Draft
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.publishButton,
              { backgroundColor: colors.success },
              isUploading && { opacity: 0.7 },
            ]}
            onPress={handleSubmit(onPublish)}
            disabled={isUploading}
          >
            {isUploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator color={colors.buttonText} size="small" />
                <Text
                  style={[
                    styles.publishButtonText,
                    { color: colors.buttonText },
                  ]}
                >
                  {Math.round(uploadProgress)}%
                </Text>
              </View>
            ) : (
              <>
                <Send size={18} color={colors.buttonText} />
                <Text
                  style={[
                    styles.publishButtonText,
                    { color: colors.buttonText },
                  ]}
                >
                  Publish
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- Header ---
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  // --- Scroll ---
  scrollContent: {
    padding: 16,
    paddingTop: 4,
    gap: 12,
  },
  // --- Sections ---
  section: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // --- Inputs ---
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  smallInput: {
    width: 80,
    marginRight: 12,
    flex: 0,
  },
  fieldError: {
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  inlineHint: {
    fontSize: 13,
    flex: 1,
    lineHeight: 42,
  },
  // --- Chips ---
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // --- Images ---
  imagesScroll: {
    marginBottom: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addImageText: {
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
  },
  // --- Toggles ---
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  toggleCircleActive: {
    transform: [{ translateX: 20 }],
  },
  // --- Location ---
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  savedLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 8,
  },
  savedLocationText: {
    fontSize: 13,
    flex: 1,
  },
  // --- Preview box ---
  previewBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  previewBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewBoxText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // --- Bottom bar ---
  bottomBar: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    gap: 10,
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  draftButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  publishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 6,
  },
  publishButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // --- Success screen ---
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  successButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  successButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  successButtonOutline: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  successButtonOutlineText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
