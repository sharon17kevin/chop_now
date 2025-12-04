import { useQuery } from '@tanstack/react-query';
import { useProductStore, fetchProductsByCategory, sortProducts } from '@/stores/useProductStore';

export function useProducts() {
  // Get category and sort from Zustand store
  const selectedCategory = useProductStore((state) => state.selectedCategory);
  const sortBy = useProductStore((state) => state.sortBy);
  const freshPicksLimit = useProductStore((state) => state.freshPicksLimit);

  // React Query automatically refetches when selectedCategory changes
  const query = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => fetchProductsByCategory(selectedCategory),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Apply sorting to the data
  const sortedProducts = query.data ? sortProducts(query.data, sortBy) : [];

  return {
    products: sortedProducts,
    totalCount: sortedProducts.length,
    freshPicksLimit,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
