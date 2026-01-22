import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VendorRating {
  average: number;
  total: number;
  breakdown: Record<string, number>;
}

export const useVendorRating = (vendorId: string) => {
  const [rating, setRating] = useState<VendorRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendorRating();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const fetchVendorRating = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all reviews for this vendor
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('vendor_id', vendorId)
        .eq('is_published', true);

      if (reviewsError) throw reviewsError;

      // Calculate rating statistics from actual reviews
      if (!reviews || reviews.length === 0) {
        // No reviews yet
        setRating({
          average: 0,
          total: 0,
          breakdown: {
            '5': 0,
            '4': 0,
            '3': 0,
            '2': 0,
            '1': 0,
          },
        });
        return;
      }

      // Calculate average
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const average = totalRating / reviews.length;

      // Calculate breakdown
      const breakdown = reviews.reduce((acc, review) => {
        const ratingKey = review.rating.toString();
        acc[ratingKey] = (acc[ratingKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Ensure all rating levels exist (even if 0)
      const completeBreakdown = {
        '5': breakdown['5'] || 0,
        '4': breakdown['4'] || 0,
        '3': breakdown['3'] || 0,
        '2': breakdown['2'] || 0,
        '1': breakdown['1'] || 0,
      };

      setRating({
        average: average,
        total: reviews.length,
        breakdown: completeBreakdown,
      });

      // Update vendor's rating in profile table (optional background update)
      if (average > 0) {
        supabase
          .from('profiles')
          .update({ rating: average })
          .eq('id', vendorId)
          .then(() => console.log('Vendor rating updated in profile'))
          .catch((err) => console.error('Error updating vendor rating:', err));
      }
    } catch (err: any) {
      console.error('Error fetching vendor rating:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { rating, loading, error, refetch: fetchVendorRating };
};
