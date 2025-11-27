import { useEffect } from 'react';
import { useSearchStore, Product, SearchFilters } from '@/stores/useSearchStore';

export type { Product, SearchFilters };

interface UseSearchReturn {
  results: Product[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  refetch: () => Promise<void>;
}

/**
 * Hook for searching products by name and description with filtering support
 * Uses Zustand store to prevent duplicate searches and maintain state
 * @param query - Search query string (should be debounced before passing)
 */
export const useSearch = (query: string): UseSearchReturn => {
  const {
    results,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    searchProducts,
  } = useSearchStore();

  // Trigger search when query changes
  useEffect(() => {
    if (query && query.trim().length >= 2) {
      searchProducts(query, filters);
    } else if (query.trim().length === 0) {
      useSearchStore.setState({ results: [], error: null });
    }
  }, [query, filters, searchProducts]);

  const refetch = async () => {
    if (query && query.trim().length >= 2) {
      await searchProducts(query, filters);
    }
  };

  return {
    results,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    refetch,
  };
};

export default useSearch;
