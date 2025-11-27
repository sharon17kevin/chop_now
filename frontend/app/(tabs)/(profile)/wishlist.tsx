import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Trash2, ShoppingCart, Heart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import { useTheme } from '@/hooks/useTheme';

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    description: string;
    vendor_id: string;
    vendor?: {
      full_name: string;
    };
  };
}

export default function WishlistScreen() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    try {
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to view your wishlist');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('wishlist')
        .select(
          `
          id,
          product:products!inner (
            id,
            name,
            price,
            image_url,
            description,
            vendor_id,
            profiles!products_vendor_id_fkey (
              full_name
            )
          )
        `
        )
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Transform the data to match interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image_url: item.product.image_url,
          description: item.product.description,
          vendor_id: item.product.vendor_id,
          vendor: item.product.profiles?.[0]
            ? {
                full_name: item.product.profiles[0].full_name,
              }
            : undefined,
        },
      }));

      setWishlist(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWishlist(itemId: string) {
    try {
      const { error: deleteError } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      setWishlist((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  }

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <View
      style={[
        styles.itemContainer,
        { backgroundColor: colors.card, shadowColor: colors.text },
      ]}
    >
      <Image
        source={{
          uri: item.product.image_url || 'https://via.placeholder.com/100',
        }}
        style={[styles.image, { backgroundColor: colors.filter }]}
      />
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {item.product.name}
        </Text>
        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.product.description}
        </Text>
        {item.product.vendor && (
          <Text
            style={[styles.vendor, { color: colors.primary }]}
            numberOfLines={1}
          >
            by {item.product.vendor.full_name}
          </Text>
        )}
        <Text style={[styles.price, { color: colors.primary }]}>
          ₦{item.product.price.toLocaleString()}
        </Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.errorBackground },
          ]}
          onPress={() => removeFromWishlist(item.id)}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color={colors.error} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.filter }]}
          activeOpacity={0.7}
        >
          <ShoppingCart size={18} color={colors.success} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Favourites" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Favourites" />
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.errorBackground,
              borderLeftColor: colors.error,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={fetchWishlist}>
            <Text style={[styles.retryText, { color: colors.error }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconContainer,
              { backgroundColor: colors.filter },
            ]}
          >
            <Heart size={48} color={colors.textTetiary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Unable to load favorites
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Check your connection and try again
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Favourites" />

      <FlatList
        data={wishlist}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.filter },
              ]}
            >
              <Heart size={48} color={colors.textTetiary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No favorites yet
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Items you favorite will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  vendor: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionsContainer: {
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
});
