import { useState, useEffect } from 'react';
import { ReviewService } from '@/services/reviews';

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

      const reviews = await ReviewService.getVendorRatings(vendorId);

      if (!reviews || reviews.length === 0) {
        setRating({
          average: 0,
          total: 0,
          breakdown: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        });
        return;
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const average = totalRating / reviews.length;

      const breakdown = reviews.reduce((acc, review) => {
        const ratingKey = review.rating.toString();
        acc[ratingKey] = (acc[ratingKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const completeBreakdown = {
        '5': breakdown['5'] || 0,
        '4': breakdown['4'] || 0,
        '3': breakdown['3'] || 0,
        '2': breakdown['2'] || 0,
        '1': breakdown['1'] || 0,
      };

      setRating({
        average,
        total: reviews.length,
        breakdown: completeBreakdown,
      });

      // Update vendor's rating in profile table (background)
      if (average > 0) {
        ReviewService.updateVendorRating(vendorId, average)
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
