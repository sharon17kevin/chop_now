import { useQuery } from '@tanstack/react-query';
import { ReviewService } from '../services/reviews';
import { Review } from './useVendorReviews';

export interface ProductRatingData {
  average: number;
  total: number;
  breakdown: { [key: string]: number };
}

export interface ProductReviewsData {
  reviews: Review[];
  total: number;
}

export const useProductRating = (productId: string) => {
  return useQuery<ProductRatingData>({
    queryKey: ['productRating', productId],
    queryFn: () => ReviewService.getProductRatingSummary(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProductReviews = (
  productId: string, 
  options?: { 
    rating?: number; 
    limit?: number; 
    offset?: number; 
  }
) => {
  return useQuery<ProductReviewsData>({
    queryKey: ['productReviews', productId, options?.rating, options?.offset],
    queryFn: async () => {
      const result = await ReviewService.getProductReviews(productId, options);
      return {
        reviews: result.data.map((review: any) => ({
          ...review,
          reviewer_name: review.profiles?.full_name || 'Anonymous',
          reviewer_image: review.profiles?.profile_image || null,
        })),
        total: result.count,
      };
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};