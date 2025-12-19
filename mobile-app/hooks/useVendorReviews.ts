import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

  // Joined data
  reviewer_name: string;
  reviewer_image: string | null;
}

export const useVendorReviews = (
  vendorId: string,
  options?: {
    rating?: number; // Filter by specific rating (1-5)
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

      let query = supabase
        .from('reviews')
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            profile_image
          )
        `,
          { count: 'exact' }
        )
        .eq('vendor_id', vendorId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by rating if specified
      if (options?.rating) {
        query = query.eq('rating', options.rating);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      console.log('Raw review data:', JSON.stringify(data?.[0], null, 2)); // Debug log

      // Transform data to match Review interface
      const transformedReviews: Review[] = (data || []).map((review: any) => {
        // Handle the joined profiles data - it might be nested differently
        const profileData = review.profiles || review.user_id || {};
        
        return {
          ...review,
          reviewer_name: profileData?.full_name || 'Anonymous',
          reviewer_image: profileData?.profile_image || null,
        };
      });

      console.log('Transformed review:', JSON.stringify(transformedReviews[0], null, 2)); // Debug log

      setReviews(transformedReviews);
      setTotalCount(count || 0);
      setHasMore(count ? offset + limit < count : false);
    } catch (err: any) {
      console.error('Error fetching vendor reviews:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const currentOffset = options?.offset || 0;
      const limit = options?.limit || 20;
      // You would need to pass this back to the parent component to update options
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
