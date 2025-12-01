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
  // Current selected category
  selectedCategory: CategoryFilter;
  
  // Current sort option
  sortBy: SortOption;
  
  // Fresh picks pagination
  freshPicksLimit: number;
  
  // Actions
  setCategory: (category: CategoryFilter) => void;
  setSortBy: (sort: SortOption) => void;
  loadMoreFreshPicks: () => void;
  resetFreshPicksLimit: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  selectedCategory: 'All',
  sortBy: 'recent',
  freshPicksLimit: 10,

  setCategory: (category: CategoryFilter) => {
    console.log('🔍 ProductStore: Category changed to', category);
    set({ selectedCategory: category, freshPicksLimit: 10 }); // Reset limit on category change
  },

  setSortBy: (sort: SortOption) => {
    console.log('🔄 ProductStore: Sort changed to', sort);
    set({ sortBy: sort });
  },

  loadMoreFreshPicks: () => {
    set((state) => ({ freshPicksLimit: state.freshPicksLimit + 10 }));
  },

  resetFreshPicksLimit: () => {
    set({ freshPicksLimit: 10 });
  },
}));

// Fetch products from Supabase
export async function fetchProductsByCategory(category: CategoryFilter): Promise<Product[]> {
  console.log('📦 Fetching products for category:', category);

  const query = supabase
    .from('products')
    .select(`
      *,
      profiles:vendor_id (full_name)
    `)
    .eq('is_available', true);

  // Apply category filter
  if (category !== 'All') {
    query.eq('category', category);
  }

  const { data: products, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }

  console.log('✅ Fetched', products?.length || 0, 'products');
  return products || [];
}

// Helper function to sort products
export function sortProducts(products: Product[], sortBy: SortOption): Product[] {
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

// Smart Selectors
export function getHotDeals(products: Product[]): Product[] {
  const now = new Date();
  
  // Get products on sale that haven't expired
  let activeDeals = products.filter(p => {
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
  
  // Fallback: If no deals exist, return first 10 products
  console.log('⚠️ No active deals found, showing regular products');
  return products.slice(0, 10);
}

export function getTrendingProducts(products: Product[]): Product[] {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentProducts = products
    .filter(p => new Date(p.created_at) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);
  
  // If no recent products, return most recent 10
  if (recentProducts.length === 0) {
    return products
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }
  
  return recentProducts;
}

export function getFreshPicks(products: Product[], limit: number = 10): Product[] {
  // Return first N products sorted by creation date (newest first)
  // The products are already filtered by category from the React Query hook
  return products
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
