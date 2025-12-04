
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  unit: string;
  is_available: boolean;
  created_at: string;
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

      // Fetch all products for this vendor
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_available', true)
        .order('category')
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      const fetchedProducts = (data || []) as Product[];
      setProducts(fetchedProducts);

      // Extract unique categories
      const uniqueCategories = [
        'All',
        ...Array.from(new Set(fetchedProducts.map((p) => p.category).filter(Boolean))),
      ];
      setCategories(uniqueCategories);

      // Group products by category
      const grouped = fetchedProducts.reduce((acc, product) => {
        const cat = product.category || 'Other';
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      // Add "All" category with all products
      grouped['All'] = fetchedProducts;

      setProductsByCategory(grouped);
      console.log('✅ Fetched', fetchedProducts.length, 'products in', uniqueCategories.length - 1, 'categories');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      console.error('❌ Error fetching vendor products:', errorMessage);
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