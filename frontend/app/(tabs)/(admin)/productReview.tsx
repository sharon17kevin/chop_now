import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  Package,
  Store,
  X,
  Image as ImageIcon,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  unit: string;
  images: string[];
  location: any;
  is_organic: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    full_name: string;
    business_name: string;
  };
}

export default function ProductReview() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = [
    'all',
    'fruits',
    'vegetables',
    'dairy',
    'grains',
    'herbs',
    'other',
  ];

  // Check if user is admin
  useEffect(() => {
    if (profile?.role !== 'admin') {
      Alert.alert('Access Denied', 'Only admins can access this page.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [profile, router]);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(
          `
          *,
          profiles:vendor_id(full_name, business_name)
        `
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleApprove = async (product: Product) => {
    Alert.alert(
      'Approve Product',
      `Approve "${product.name}" for the marketplace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessing(true);

              const { error } = await supabase.rpc('approve_product', {
                product_id: product.id,
                admin_id: profile?.id,
              });

              if (error) throw error;

              Alert.alert('Success', 'Product approved!');
              fetchProducts();
              setSelectedProduct(null);
            } catch (error: any) {
              console.error('Error approving product:', error);
              Alert.alert('Error', error.message || 'Failed to approve');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason');
      return;
    }

    if (!selectedProduct) return;

    try {
      setProcessing(true);

      const { error } = await supabase.rpc('reject_product', {
        product_id: selectedProduct.id,
        admin_id: profile?.id,
        rejection_reason: rejectionReason,
      });

      if (error) throw error;

      Alert.alert('Product Rejected', 'Vendor has been notified.');
      setShowRejectModal(false);
      setRejectionReason('');
      fetchProducts();
      setSelectedProduct(null);
    } catch (error: any) {
      console.error('Error rejecting product:', error);
      Alert.alert('Error', error.message || 'Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={() => {
        setSelectedProduct(item);
        setSelectedImageIndex(0);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.productImagePlaceholder,
              { backgroundColor: colors.filter },
            ]}
          >
            <ImageIcon size={32} color={colors.textSecondary} />
          </View>
        )}

        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={[styles.productName, { color: colors.text }]}>
              {item.name}
            </Text>
            {item.is_organic && (
              <Text style={styles.organicBadge}>🌱 Organic</Text>
            )}
          </View>

          <Text style={[styles.vendorName, { color: colors.textSecondary }]}>
            by{' '}
            {item.profiles?.business_name ||
              item.profiles?.full_name ||
              'Unknown'}
          </Text>

          <Text style={[styles.category, { color: colors.secondary }]}>
            {item.category}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.success }]}>
              ${item.price.toFixed(2)}/{item.unit}
            </Text>
            <Text style={[styles.stock, { color: colors.textSecondary }]}>
              Stock: {item.stock} {item.unit}
            </Text>
          </View>

          {item.location?.address && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text
                style={[styles.locationText, { color: colors.textSecondary }]}
              >
                {item.location.address}
              </Text>
            </View>
          )}

          <View style={styles.timeRow}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!selectedProduct) return null;

    return (
      <View
        style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Product Review
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Image Gallery */}
            {selectedProduct.images && selectedProduct.images.length > 0 && (
              <View style={styles.imageGallery}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={(e) => {
                    const index = Math.round(
                      e.nativeEvent.contentOffset.x / (width - 40)
                    );
                    setSelectedImageIndex(index);
                  }}
                  scrollEventThrottle={16}
                >
                  {selectedProduct.images.map((uri, index) => (
                    <Image
                      key={index}
                      source={{ uri }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
                <View style={styles.imageIndicators}>
                  {selectedProduct.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        {
                          backgroundColor:
                            index === selectedImageIndex
                              ? colors.success
                              : colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Product Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={[styles.productNameLarge, { color: colors.text }]}>
                  {selectedProduct.name}
                </Text>
                {selectedProduct.is_organic && (
                  <View
                    style={[
                      styles.organicBadgeLarge,
                      { backgroundColor: colors.success + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.organicBadgeText,
                        { color: colors.success },
                      ]}
                    >
                      🌱 Organic
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.infoRow}>
                <Package size={16} color={colors.secondary} />
                <Text
                  style={[styles.infoText, { color: colors.textSecondary }]}
                >
                  {selectedProduct.category}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Store size={16} color={colors.secondary} />
                <Text
                  style={[styles.infoText, { color: colors.textSecondary }]}
                >
                  {selectedProduct.profiles?.business_name ||
                    selectedProduct.profiles?.full_name ||
                    'Unknown Vendor'}
                </Text>
              </View>

              {selectedProduct.location?.address && (
                <View style={styles.infoRow}>
                  <MapPin size={16} color={colors.secondary} />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                  >
                    {selectedProduct.location.address}
                  </Text>
                </View>
              )}

              <View style={styles.priceStockRow}>
                <View>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Price
                  </Text>
                  <Text style={[styles.priceLarge, { color: colors.success }]}>
                    ${selectedProduct.price.toFixed(2)}
                  </Text>
                  <Text style={[styles.unit, { color: colors.textSecondary }]}>
                    per {selectedProduct.unit}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Stock
                  </Text>
                  <Text style={[styles.stockLarge, { color: colors.text }]}>
                    {selectedProduct.stock}
                  </Text>
                  <Text style={[styles.unit, { color: colors.textSecondary }]}>
                    {selectedProduct.unit}
                  </Text>
                </View>
              </View>

              <View style={styles.descriptionSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Description
                </Text>
                <Text
                  style={[styles.description, { color: colors.textSecondary }]}
                >
                  {selectedProduct.description}
                </Text>
              </View>

              <View style={styles.dateSection}>
                <Text
                  style={[styles.dateLabel, { color: colors.textSecondary }]}
                >
                  Submitted on{' '}
                  {new Date(selectedProduct.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.rejectButton, { backgroundColor: colors.error }]}
                onPress={() => setShowRejectModal(true)}
                disabled={processing}
              >
                <X size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.approveButton,
                  { backgroundColor: colors.success },
                ]}
                onPress={() => handleApprove(selectedProduct)}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Check size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Rejection Modal */}
        {showRejectModal && (
          <View
            style={[
              styles.rejectModalOverlay,
              { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            ]}
          >
            <View
              style={[styles.rejectModal, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.rejectTitle, { color: colors.text }]}>
                Reject Product
              </Text>
              <Text
                style={[styles.rejectSubtitle, { color: colors.textSecondary }]}
              >
                Please provide a reason for rejection
              </Text>

              <TextInput
                style={[
                  styles.rejectInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g., Poor image quality, incomplete description..."
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
              />

              <View style={styles.rejectActions}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { backgroundColor: colors.filter },
                  ]}
                  onPress={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  disabled={processing}
                >
                  <Text
                    style={[styles.cancelButtonText, { color: colors.text }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmRejectButton,
                    { backgroundColor: colors.error },
                  ]}
                  onPress={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmRejectButtonText}>
                      Confirm Rejection
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading products...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Product Review
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.secondary }]}>
            {products.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Pending
          </Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              categoryFilter === cat && {
                backgroundColor: colors.secondary,
                borderColor: colors.secondary,
              },
            ]}
            onPress={() => setCategoryFilter(cat)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                { color: colors.text },
                categoryFilter === cat && { color: '#fff' },
              ]}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product List */}
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Pending Products
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            All products in this category have been reviewed
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.secondary}
            />
          }
        />
      )}

      {/* Detail Modal */}
      {selectedProduct && renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  organicBadge: {
    fontSize: 12,
    marginLeft: 8,
  },
  vendorName: {
    fontSize: 14,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stock: {
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalContent: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageGallery: {
    marginBottom: 16,
  },
  galleryImage: {
    width: width - 40,
    height: 300,
    marginHorizontal: 20,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  detailsSection: {
    paddingHorizontal: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  productNameLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  organicBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  organicBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginVertical: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceLarge: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  stockLarge: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 12,
    marginTop: 4,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  dateSection: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  rejectModal: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
  },
  rejectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rejectSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  rejectInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 16,
  },
  rejectActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmRejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmRejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
