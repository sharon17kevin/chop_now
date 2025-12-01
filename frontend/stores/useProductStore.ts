import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  original_price?: number | null;
  discount_percentage?: number | null;
  is_on_sale?: boolean;
  sale_ends_at?: string | null;
  image_url: string | null;
  category: string | null;
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

export type CategoryFilter = 
  | 'All'
  | 'Fruits' 
  | 'Vegetable' 
  | 'Dairy' 
  | 'Grains' 
  | 'Spices' 
  | 'Sauces'
  | 'Meat' 
  | 'Legumes' 
  | 'Flour'
  | 'Essentials';

export type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'name' | 'popular';

interface ProductState {
  // All products from database
  allProducts: Product[];
  
  // Filtered products
  filteredProducts: Product[];
  
  // Current selected category
  selectedCategory: CategoryFilter;
  
  // Current sort option
  sortBy: SortOption;
  
  // Cache management
  lastFetchTime: number | null;
  cacheExpiryTime: number; // 5 minutes in milliseconds
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  
  // Actions
  fetchProducts: () => Promise<void>;
  setCategory: (category: CategoryFilter) => void;
  setSortBy: (sort: SortOption) => void;
  refreshProducts: () => Promise<void>;
  
  // Smart Selectors
  getHotDeals: () => Product[];
  getTrendingProducts: () => Product[];
  getFreshPicks: () => Product[];
}

export const useProductStore = create<ProductState>((set, get) => ({
  allProducts: [],
  filteredProducts: [],
  selectedCategory: 'All',
  sortBy: 'recent',
  lastFetchTime: null,
  cacheExpiryTime: 5 * 60 * 1000, // 5 minutes
  loading: false,
  refreshing: false,
  error: null,

  fetchProducts: async () => {
    try {
      const { lastFetchTime, cacheExpiryTime, allProducts } = get();
      const now = Date.now();

      // Check if cache is still valid
      if (
        lastFetchTime && 
        allProducts.length > 0 && 
        now - lastFetchTime < cacheExpiryTime
      ) {
        console.log('📦 ProductStore: Using cached products');
        return;
      }

      set({ loading: true, error: null });

      console.log('📦 ProductStore: Fetching products from database...');

      const { data: products, error: queryError } = await supabase
        .from('products')
        .select(`
          *,
          profiles:vendor_id (full_name)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('❌ ProductStore: Query error:', queryError);
        throw queryError;
      }

      console.log('✅ ProductStore: Fetched', products?.length || 0, 'products');
      if (products && products.length > 0) {
        console.log('📊 ProductStore: Sample product:', products[0]);
        console.log('📊 ProductStore: All unique categories:', 
          [...new Set(products.map(p => p.category).filter(Boolean))].join(', ')
        );
      }

      // Apply initial filtering based on selected category
      const { selectedCategory } = get();
      const filtered = selectedCategory === 'All'
        ? products || []
        : (products || []).filter(product => {
            const productCategory = product.category?.toLowerCase() || '';
            const selected = selectedCategory.toLowerCase();
            return productCategory === selected;
          });

      set({ 
        allProducts: products || [],
        filteredProducts: filtered,
        lastFetchTime: now,
        loading: false 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      console.error('❌ ProductStore: Error fetching products:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  refreshProducts: async () => {
    try {
      set({ refreshing: true, error: null });

      const { data: products, error: queryError } = await supabase
        .from('products')
        .select(`
          *,
          profiles:vendor_id (full_name)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const { selectedCategory } = get();
      const filtered = selectedCategory === 'All' 
        ? products || []
        : (products || []).filter(p => {
            const productCategory = p.category?.toLowerCase() || '';
            const selected = selectedCategory.toLowerCase();
            return productCategory === selected;
          });

      set({ 
        allProducts: products || [],
        filteredProducts: filtered,
        lastFetchTime: Date.now(),
        refreshing: false 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh products';
      console.error('❌ ProductStore: Error refreshing:', errorMessage);
      set({ error: errorMessage, refreshing: false });
    }
  },

  setCategory: (category: CategoryFilter) => {
    const { allProducts, sortBy } = get();
    
    // Filter by category
    let filtered = category === 'All'
      ? allProducts
      : allProducts.filter(product => {
          const productCategory = product.category?.toLowerCase() || '';
          const selectedCategory = category.toLowerCase();
          return productCategory === selectedCategory;
        });

    // Apply current sort
    filtered = sortProducts(filtered, sortBy);

    console.log('🔍 ProductStore: Category changed to', category, '- Filtered:', filtered.length, 'products');
    if (filtered.length === 0 && category !== 'All') {
      console.log('⚠️ ProductStore: No products found. Available categories:', 
        [...new Set(allProducts.map(p => p.category).filter(Boolean))].join(', ')
      );
    }

    set({ 
      selectedCategory: category,
      filteredProducts: filtered 
    });
  },

  setSortBy: (sort: SortOption) => {
    const { filteredProducts } = get();
    const sorted = sortProducts([...filteredProducts], sort);
    
    console.log('🔄 ProductStore: Sort changed to', sort);
    
    set({ 
      sortBy: sort,
      filteredProducts: sorted 
    });
  },

  // Smart Selectors
  getHotDeals: () => {
    const { filteredProducts } = get();
    const now = new Date();
    
    // Get products on sale that haven't expired
    let activeDeals = filteredProducts.filter(p => {
      if (!p.is_on_sale) return false;
      if (p.sale_ends_at && new Date(p.sale_ends_at) < now) return false;
      return true;
    });
    
    // If we have active deals, sort by discount percentage (highest first)
    if (activeDeals.length > 0) {
      return activeDeals
        .sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0))
        .slice(0, 10);
    }
    
    // Fallback: If no deals exist, return first 10 filtered products
    console.log('⚠️ ProductStore: No active deals found, showing regular products');
    return filteredProducts.slice(0, 10);
  },

  getTrendingProducts: () => {
    const { allProducts } = get();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentProducts = allProducts
      .filter(p => new Date(p.created_at) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
    
    // If no recent products, return most recent 10
    if (recentProducts.length === 0) {
      return allProducts
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    }
    
    return recentProducts;
  },

  getFreshPicks: () => {
    const { filteredProducts } = get();
    
    // Group products by category
    const byCategory: { [key: string]: Product[] } = {};
    filteredProducts.forEach(product => {
      const cat = product.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(product);
    });

    // Take 1-2 products from each category for diversity
    const picks: Product[] = [];
    Object.values(byCategory).forEach(categoryProducts => {
      const count = Math.min(2, categoryProducts.length);
      picks.push(...categoryProducts.slice(0, count));
    });

    // Shuffle and return up to 20 products
    return picks
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
  },
}));

// Helper function to sort products
function sortProducts(products: Product[], sortBy: SortOption): Product[] {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'popular':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'recent':
    default:
      return sorted.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}
