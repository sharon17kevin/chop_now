import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Product {
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
  rating?: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
  };
}

interface UseHomeProductsReturn {
  topRatedProducts: Product[];
  readyToEatProducts: Product[];
  recommendedProducts: Product[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  handleRefresh: () => Promise<void>;
}

export const useHomeProducts = (): UseHomeProductsReturn => {
  const [topRatedProducts, setTopRatedProducts] = useState<Product[]>([]);
  const [readyToEatProducts, setReadyToEatProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
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

      // Fetch all available products with vendor information
      const { data: products, error: queryError } = await supabase
        .from('products')
        .select(
          `
          *,
          profiles:vendor_id (full_name)
        `
        )
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      if (products && products.length > 0) {
        // Top Rated: First 5 products (can be enhanced with actual ratings later)
        const topRated = products.slice(0, 5);
        setTopRatedProducts(topRated);

        // Ready to Eat: Products 5-10 (can be filtered by category or tags)
        const readyToEat = products.slice(5, 10);
        setReadyToEatProducts(readyToEat);

        // Recommendations: First 6 products (latest)
        const recommended = products.slice(0, 6);
        setRecommendedProducts(recommended);
      } else {
        // Reset to empty if no products
        setTopRatedProducts([]);
        setReadyToEatProducts([]);
        setRecommendedProducts([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch products';
      console.error('Error fetching products:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchProducts(true);
  };

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    topRatedProducts,
    readyToEatProducts,
    recommendedProducts,
    loading,
    refreshing,
    error,
    handleRefresh,
  };
};
