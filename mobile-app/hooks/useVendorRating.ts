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

      // Fetch vendor's average rating from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('rating')
        .eq('id', vendorId)
        .single();

      if (profileError) throw profileError;

      // TODO: When you create a reviews table, fetch breakdown like this:
      // const { data: reviews, error: reviewsError } = await supabase
      //   .from('reviews')
      //   .select('rating')
      //   .eq('vendor_id', vendorId);
      
      // For now, return mock breakdown based on average
      // Replace this with real data when reviews table exists
      const avgRating = profile?.rating || 0;
      const total = Math.floor(Math.random() * 2000) + 500; // Mock total
      
      setRating({
        average: avgRating,
        total: total,
        breakdown: generateMockBreakdown(total),
      });
    } catch (err: any) {
      console.error('Error fetching vendor rating:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mock breakdown generator - replace with real data when reviews table exists
  const generateMockBreakdown = (total: number): Record<string, number> => {
    const distribution = [0.6, 0.2, 0.1, 0.06, 0.04]; // 5*, 4*, 3*, 2*, 1*
    return {
      '5': Math.floor(total * distribution[0]),
      '4': Math.floor(total * distribution[1]),
      '3': Math.floor(total * distribution[2]),
      '2': Math.floor(total * distribution[3]),
      '1': Math.floor(total * distribution[4]),
    };
  };

  return { rating, loading, error, refetch: fetchVendorRating };
};
