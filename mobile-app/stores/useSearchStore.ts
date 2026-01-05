import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

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
  
  // Search history
  recentSearches: string[];
  popularSearches: string[];
  isLoadingPopular: boolean;
  
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  searchProducts: (searchQuery: string, searchFilters?: SearchFilters) => Promise<void>;
  clearSearch: () => void;
  
  // Search history methods
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

    // Don't search for empty or very short queries
    if (!searchQuery || searchQuery.trim().length < 2) {
      set({ results: [], loading: false, error: null });
      return;
    }

    // Prevent duplicate searches for the same query
    const queryKey = `${searchQuery}:${JSON.stringify(currentFilters)}`;
    if (isSearching || lastSearchQuery === queryKey) {
      console.log('⏭️ Skipping duplicate search for:', searchQuery);
      return;
    }

    try {
      set({ loading: true, isSearching: true, error: null, lastSearchQuery: queryKey });
      console.log('🔍 Searching products for:', searchQuery, 'with filters:', currentFilters);

      // Add to recent searches and save to analytics
      get().addRecentSearch(searchQuery);
      
      // Save to database for analytics (fire and forget)
      saveSearchAnalytics(searchQuery);

      // Build the query
      const searchPattern = `%${searchQuery.trim()}%`;
      let query = supabase
        .from('products')
        .select(`
          *,
          vendor:vendor_id (
            full_name
          )
        `)
        .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .eq('is_available', true);

      // Apply filters
      if (currentFilters.category) {
        query = query.eq('category', currentFilters.category);
      }

      if (currentFilters.minPrice !== null && currentFilters.minPrice !== undefined) {
        query = query.gte('price', currentFilters.minPrice);
      }

      if (currentFilters.maxPrice !== null && currentFilters.maxPrice !== undefined) {
        query = query.lte('price', currentFilters.maxPrice);
      }

      if (currentFilters.vendorId) {
        query = query.eq('vendor_id', currentFilters.vendorId);
      }

      // Apply sorting
      switch (currentFilters.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      query = query.limit(50);

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('❌ Search error:', fetchError);
        throw fetchError;
      }

      console.log('✅ Search results:', data?.length || 0, 'products found');
      set({ results: (data as Product[]) || [], error: null });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search products';
      console.error('❌ useSearchStore error:', errorMessage);
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
      // Remove if already exists and add to front
      const filtered = state.recentSearches.filter(
        (search) => search.toLowerCase() !== trimmedQuery.toLowerCase()
      );
      
      // Keep only last 10 searches
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
      const { data, error } = await supabase
        .from('search_analytics')
        .select('search_query, search_count')
        .order('search_count', { ascending: false })
        .limit(8);

      if (error) throw error;

      const searches = data?.map((item) => item.search_query) || [];
      
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
      // Only persist recent searches
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    }
  )
);

// Helper to save search analytics (fire and forget)
async function saveSearchAnalytics(query: string) {
  try {
    await supabase.rpc('increment_search_count', {
      p_search_query: query.trim().toLowerCase(),
    });
  } catch (error) {
    console.error('Error saving search analytics:', error);
  }
}
