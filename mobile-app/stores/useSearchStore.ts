import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductService } from '@/services/products';
import { SearchService } from '@/services/search';

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number;
  unit: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  vendor?: {
    full_name: string;
  };
}

export interface SearchFilters {
  category?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: 'recent' | 'price_asc' | 'price_desc' | 'name' | null;
  vendorId?: string | null;
}

interface SearchState {
  query: string;
  filters: SearchFilters;
  results: Product[];
  loading: boolean;
  error: string | null;
  lastSearchQuery: string;
  isSearching: boolean;

  recentSearches: string[];
  popularSearches: string[];
  isLoadingPopular: boolean;

  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  searchProducts: (searchQuery: string, searchFilters?: SearchFilters) => Promise<void>;
  clearSearch: () => void;

  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (query: string) => void;
  fetchPopularSearches: () => Promise<void>;
}

const DEFAULT_POPULAR_SEARCHES = [
  'Organic tomatoes',
  'Fresh berries',
  'Local honey',
  'Free-range eggs',
  'Seasonal vegetables',
  'Fresh milk',
  'Organic carrots',
  'Apples',
];

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: '',
      filters: {},
      results: [],
      loading: false,
      error: null,
      lastSearchQuery: '',
      isSearching: false,
      recentSearches: [],
      popularSearches: DEFAULT_POPULAR_SEARCHES,
      isLoadingPopular: false,

  setQuery: (query: string) => {
    set({ query });
  },

  setFilters: (newFilters: Partial<SearchFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  searchProducts: async (searchQuery: string, searchFilters?: SearchFilters) => {
    const { lastSearchQuery, isSearching } = get();
    const currentFilters = searchFilters || get().filters;

    if (!searchQuery || searchQuery.trim().length < 2) {
      set({ results: [], loading: false, error: null });
      return;
    }

    const queryKey = `${searchQuery}:${JSON.stringify(currentFilters)}`;
    if (isSearching || lastSearchQuery === queryKey) {
      return;
    }

    try {
      set({ loading: true, isSearching: true, error: null, lastSearchQuery: queryKey });

      get().addRecentSearch(searchQuery);

      // Save analytics (fire and forget)
      SearchService.saveSearchAnalytics(searchQuery).catch(err => {
        console.error('Error saving search analytics:', err);
      });

      const data = await ProductService.search(searchQuery, currentFilters);

      set({ results: (data as Product[]) || [], error: null });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search products';
      console.error('useSearchStore error:', errorMessage);
      set({ error: errorMessage, results: [] });
    } finally {
      set({ loading: false, isSearching: false });
    }
  },

  clearSearch: () => {
    set({
      query: '',
      results: [],
      error: null,
      lastSearchQuery: '',
      isSearching: false,
    });
  },

  addRecentSearch: (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) return;

    set((state) => {
      const filtered = state.recentSearches.filter(
        (search) => search.toLowerCase() !== trimmedQuery.toLowerCase()
      );

      const updated = [trimmedQuery, ...filtered].slice(0, 10);

      return { recentSearches: updated };
    });
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
  },

  removeRecentSearch: (query: string) => {
    set((state) => ({
      recentSearches: state.recentSearches.filter((s) => s !== query),
    }));
  },

  fetchPopularSearches: async () => {
    set({ isLoadingPopular: true });

    try {
      const searches = await SearchService.getPopularSearches();

      set({
        popularSearches: searches.length > 0 ? searches : DEFAULT_POPULAR_SEARCHES,
        isLoadingPopular: false
      });
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      set({
        popularSearches: DEFAULT_POPULAR_SEARCHES,
        isLoadingPopular: false
      });
    }
  },
}),
    {
      name: 'search-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    }
  )
);
