import { useQuery } from '@tanstack/react-query';
import { ProductService } from '../services/products';

export function useProduct(productId: string | null) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => ProductService.getProductDetail(productId!),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: 1,
  });
}