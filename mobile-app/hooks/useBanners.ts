import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BannerService } from '@/services/banners';

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

  const {
    data: banners = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['banners'],
    queryFn: () => BannerService.getActiveBanners() as Promise<Banner[]>,
    staleTime: 5 * 60 * 1000,
  });

  const incrementImpressions = useMutation({
    mutationFn: (bannerId: string) => BannerService.incrementImpressions(bannerId),
  });

  const incrementClicks = useMutation({
    mutationFn: (bannerId: string) => BannerService.incrementClicks(bannerId),
    onSuccess: () => {
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
