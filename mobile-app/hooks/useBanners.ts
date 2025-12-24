import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  action_type: 'product' | 'vendor' | 'category' | 'url';
  action_id: string | null;
  action_data: any | null;
  action_url: string | null;
  is_active: boolean;
  display_order: number;
  start_date: string;
  end_date: string | null;
  clicks: number;
  impressions: number;
  created_at: string;
  updated_at: string;
}

export function useBanners() {
  const queryClient = useQueryClient();

  // Fetch active banners
  const {
    data: banners = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data as Banner[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Increment impressions
  const incrementImpressions = useMutation({
    mutationFn: async (bannerId: string) => {
      const { error } = await supabase.rpc('increment_banner_impressions', {
        banner_id: bannerId,
      });

      // Fallback if function doesn't exist
      if (error && error.code === '42883') {
        const { data: banner } = await supabase
          .from('banners')
          .select('impressions')
          .eq('id', bannerId)
          .single();

        if (banner) {
          await supabase
            .from('banners')
            .update({ impressions: (banner.impressions || 0) + 1 })
            .eq('id', bannerId);
        }
      } else if (error) {
        throw error;
      }
    },
  });

  // Increment clicks
  const incrementClicks = useMutation({
    mutationFn: async (bannerId: string) => {
      const { error } = await supabase.rpc('increment_banner_clicks', {
        banner_id: bannerId,
      });

      // Fallback if function doesn't exist
      if (error && error.code === '42883') {
        const { data: banner } = await supabase
          .from('banners')
          .select('clicks')
          .eq('id', bannerId)
          .single();

        if (banner) {
          await supabase
            .from('banners')
            .update({ clicks: (banner.clicks || 0) + 1 })
            .eq('id', bannerId);
        }
      } else if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Optionally refetch banners to update counts
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });

  return {
    banners,
    isLoading,
    error,
    refetch,
    incrementImpressions: incrementImpressions.mutate,
    incrementClicks: incrementClicks.mutate,
  };
}
