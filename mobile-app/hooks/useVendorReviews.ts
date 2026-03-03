import { useState, useEffect } from 'react';
import { ReviewService } from '@/services/reviews';

export interface Review {
  id: string;
  user_id: string;
  vendor_id: string;
  rating: number;
  title: string | null;
  comment: string;
  images: string[];
  helpful_count: number;
  not_helpful_count: number;
  verified_purchase: boolean;
  vendor_response: string | null;
  vendor_response_at: string | null;
  created_at: string;
  updated_at: string;
  reviewer_name: string;
  reviewer_image: string | null;
}

export const useVendorReviews = (
  vendorId: string,
  options?: {
    rating?: number;
    limit?: number;
    offset?: number;
  }
) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (vendorId) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, options?.rating, options?.offset]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const limit = options?.limit || 20;
      const offset = options?.offset || 0;

      const { data, count } = await ReviewService.getVendorReviews(vendorId, {
        rating: options?.rating,
        limit,
        offset,
      });

      // Transform data to match Review interface
      const transformedReviews: Review[] = data.map((review: any) => {
        const profileData = review.profiles || review.user_id || {};

        return {
          ...review,
          reviewer_name: profileData?.full_name || 'Anonymous',
          reviewer_image: profileData?.profile_image || null,
        };
      });

      setReviews(transformedReviews);
      setTotalCount(count);
      setHasMore(offset + limit < count);
    } catch (err: any) {
      console.error('Error fetching vendor reviews:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchReviews();
    }
  };

  return {
    reviews,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refetch: fetchReviews,
  };
};
