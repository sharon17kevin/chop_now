import { useQuery } from '@tanstack/react-query';
import { ProfileService } from '@/services/profiles';

export function useWalletBalance(userId?: string) {
  return useQuery({
    queryKey: ['wallet-balance', userId],
    queryFn: async () => {
      if (!userId) return 0;
      return ProfileService.getWalletBalance(userId);
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds - wallet balance changes infrequently
  });
}
