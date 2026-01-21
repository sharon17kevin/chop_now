import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
import {
  Package,
  Edit2,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Minus,
  Save,
} from 'lucide-react-native';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  unit: string;
  is_available: boolean;
  image_url: string;
}

export default function StockManagementScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Fetch vendor products
  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vendor-stock', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name, category, stock, price, unit, is_available, image_url',
        )
        .eq('vendor_id', user.id)
        .order('stock', { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user?.id,
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({
      productId,
      newStock,
    }: {
      productId: string;
      newStock: number;
    }) => {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-stock'] });
      setShowUpdateModal(false);
      setSelectedProduct(null);
      setStockAdjustment('');
      Alert.alert('Success', 'Stock updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update stock');
    },
  });

  const handleQuickAdjust = (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    updateStockMutation.mutate({ productId: product.id, newStock });
  };

  const handleManualUpdate = () => {
    if (!selectedProduct) return;

    const adjustment = parseInt(stockAdjustment);
    if (isNaN(adjustment)) {
      Alert.alert('Invalid Input', 'Please enter a valid number');
      return;
    }

    const newStock = Math.max(0, selectedProduct.stock + adjustment);
    updateStockMutation.mutate({
      productId: selectedProduct.id,
      newStock,
    });
  };

  const openUpdateModal = (product: Product) => {
    setSelectedProduct(product);
    setStockAdjustment('');
    setShowUpdateModal(true);
  };

  const filteredProducts = filterLowStock
    ? products.filter((p) => p.stock <= 10)
    : products;

  const stats = {
    total: products.length,
    lowStock: products.filter((p) => p.stock <= 10).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.stock <= 10;
    const isOutOfStock = item.stock === 0;

    return (
      <View
        style={[
          styles.productCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text
              style={[styles.productName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.stockBadge}>
              {isOutOfStock ? (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <AlertTriangle size={12} color="#fff" />
                  <Text style={styles.badgeText}>Out</Text>
                </View>
              ) : isLowStock ? (
                <View
                  style={[styles.badge, { backgroundColor: colors.warning }]}
                >
                  <AlertTriangle size={12} color="#fff" />
                  <Text style={styles.badgeText}>Low</Text>
                </View>
              ) : (
                <View
                  style={[styles.badge, { backgroundColor: colors.success }]}
                >
                  <CheckCircle size={12} color="#fff" />
                  <Text style={styles.badgeText}>OK</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {item.category} • ₦{item.price.toLocaleString()}/{item.unit}
          </Text>

          <View style={styles.stockRow}>
            <Text
              style={[
                styles.stockText,
                {
                  color: isOutOfStock
                    ? colors.error
                    : isLowStock
                      ? colors.warning
                      : colors.text,
                },
              ]}
            >
              Current Stock:{' '}
              <Text style={styles.stockNumber}>{item.stock}</Text> {item.unit}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.quickButton,
              { backgroundColor: colors.error + '20' },
            ]}
            onPress={() => handleQuickAdjust(item, -1)}
            disabled={item.stock === 0 || updateStockMutation.isPending}
          >
            <Minus size={16} color={colors.error} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.secondary }]}
            onPress={() => openUpdateModal(item)}
            disabled={updateStockMutation.isPending}
          >
            <Edit2 size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickButton,
              { backgroundColor: colors.success + '20' },
            ]}
            onPress={() => handleQuickAdjust(item, 1)}
            disabled={updateStockMutation.isPending}
          >
            <Plus size={16} color={colors.success} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <AppHeader title="Stock Management" />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Please log in to manage stock
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <AppHeader title="Stock Management" />

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Package size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.total}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total Products
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <AlertTriangle size={20} color={colors.warning} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.lowStock}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Low Stock
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <AlertTriangle size={20} color={colors.error} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.outOfStock}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Out of Stock
          </Text>
        </View>
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor: filterLowStock ? colors.warning : colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setFilterLowStock(!filterLowStock)}
      >
        <AlertTriangle
          size={16}
          color={filterLowStock ? '#fff' : colors.textSecondary}
        />
        <Text
          style={[
            styles.filterText,
            { color: filterLowStock ? '#fff' : colors.text },
          ]}
        >
          {filterLowStock ? 'Show All Products' : 'Show Low Stock Only'}
        </Text>
      </TouchableOpacity>

      {/* Products List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Failed to load products
          </Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centered}>
          <Package size={48} color={colors.textTetiary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {filterLowStock ? 'No low stock items' : 'No products yet'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {filterLowStock
              ? 'All your products have sufficient stock'
              : 'Add products to start managing stock'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Update Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Update Stock
              </Text>
              <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <View>
                <Text style={[styles.productNameModal, { color: colors.text }]}>
                  {selectedProduct.name}
                </Text>
                <Text
                  style={[
                    styles.currentStockText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Current Stock: {selectedProduct.stock} {selectedProduct.unit}
                </Text>

                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Add/Remove Stock
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.filter,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="e.g. +50 or -10"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={stockAdjustment}
                  onChangeText={setStockAdjustment}
                />

                <Text
                  style={[
                    styles.newStockPreview,
                    { color: colors.textSecondary },
                  ]}
                >
                  New Stock:{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    {Math.max(
                      0,
                      selectedProduct.stock + (parseInt(stockAdjustment) || 0),
                    )}{' '}
                    {selectedProduct.unit}
                  </Text>
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: colors.filter },
                    ]}
                    onPress={() => setShowUpdateModal(false)}
                  >
                    <Text
                      style={[styles.modalButtonText, { color: colors.text }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: colors.secondary,
                        opacity: updateStockMutation.isPending ? 0.6 : 1,
                      },
                    ]}
                    onPress={handleManualUpdate}
                    disabled={updateStockMutation.isPending}
                  >
                    {updateStockMutation.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Save size={16} color="#fff" />
                        <Text
                          style={[styles.modalButtonText, { color: '#fff' }]}
                        >
                          Update
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  stockBadge: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  category: {
    fontSize: 13,
    marginBottom: 8,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stockNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  productNameModal: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  currentStockText: {
    fontSize: 14,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  newStockPreview: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
