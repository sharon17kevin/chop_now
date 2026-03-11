import { useState, useEffect } from 'react';
import { ProductService } from '@/services/products';

interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number | null;
  discount_percentage?: number | null;
  is_on_sale?: boolean;
  sale_ends_at?: string | null;
  image_url: string;
  category: string;
  stock: number;
  unit: string;
  is_available: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  minimum_order_quantity?: number;
  order_increment?: number | null;
  bulk_discount_tiers?: {min_quantity: number; discount_percent: number}[] | null;
}

interface UseVendorProductsReturn {
  products: Product[];
  categories: string[];
  productsByCategory: { [key: string]: Product[] };
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  handleRefresh: () => Promise<void>;
}

export const useVendorProducts = (vendorId: string): UseVendorProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<{ [key: string]: Product[] }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data = await ProductService.getByVendor(vendorId);
      const fetchedProducts = data as Product[];
      setProducts(fetchedProducts);

      const uniqueCategories = [
        'All',
        ...Array.from(new Set(fetchedProducts.map((p) => p.category).filter(Boolean))),
      ];
      setCategories(uniqueCategories);

      const grouped = fetchedProducts.reduce((acc, product) => {
        const cat = product.category || 'Other';
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      grouped['All'] = fetchedProducts;
      setProductsByCategory(grouped);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      console.error('Error fetching vendor products:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchProducts(true);
  };

  useEffect(() => {
    if (vendorId) {
      fetchProducts();
    }
  }, [vendorId]);

  return {
    products,
    categories,
    productsByCategory,
    loading,
    error,
    refreshing,
    handleRefresh,
  };
};
