import { create } from 'zustand';
import { ProductService } from '@/services/products';

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
  images?: string[] | null;
  category: string | null;
  stock: number;
  unit: string;
  is_available: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  is_organic?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  tags?: string[] | null;
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
  selectedCategory: CategoryFilter;
  sortBy: SortOption;
  freshPicksLimit: number;
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
    set({ selectedCategory: category, freshPicksLimit: 10 });
  },

  setSortBy: (sort: SortOption) => {
    set({ sortBy: sort });
  },

  loadMoreFreshPicks: () => {
    set((state) => ({ freshPicksLimit: state.freshPicksLimit + 10 }));
  },

  resetFreshPicksLimit: () => {
    set({ freshPicksLimit: 10 });
  },
}));

// Fetch products from service layer
export async function fetchProductsByCategory(category: CategoryFilter): Promise<Product[]> {
  return ProductService.getByCategory(category) as Promise<Product[]>;
}

// Helper function to check if a discount is currently active
export function isDiscountActive(product: Product): boolean {
  const now = new Date();
  const isOnSale = product.is_on_sale === true;
  const hasDiscount = (product.discount_percentage || 0) > 0;
  const notExpired = !product.sale_ends_at || new Date(product.sale_ends_at) > now;

  return isOnSale && hasDiscount && notExpired;
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
  const activeDeals = products.filter(p => isDiscountActive(p));

  if (activeDeals.length > 0) {
    return activeDeals
      .sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0))
      .slice(0, 10);
  }

  return products.slice(0, 10);
}

export function getTrendingProducts(products: Product[]): Product[] {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentProducts = products
    .filter(p => new Date(p.created_at) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  if (recentProducts.length === 0) {
    return products
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }

  return recentProducts;
}

export function getFreshPicks(products: Product[], limit: number = 10): Product[] {
  return products
    .map(p => {
      if (!isDiscountActive(p) && (p.is_on_sale || p.discount_percentage)) {
        return {
          ...p,
          is_on_sale: false,
          discount_percentage: 0,
          original_price: null,
        };
      }
      return p;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
