import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface VirtualAccount {
  id: string;
  user_id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  is_active: boolean;
  created_at: string;
}

interface VirtualAccountStore {
  account: VirtualAccount | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAccount: (userId: string) => Promise<void>;
  setAccount: (account: VirtualAccount) => void;
  clearAccount: () => void;
}

export const useVirtualAccountStore = create<VirtualAccountStore>((set) => ({
  account: null,
  isLoading: false,
  error: null,

  fetchAccount: async (userId: string) => {
    if (!userId) {
      set({ account: null, isLoading: false, error: 'No user ID provided' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('virtual_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      set({ account: data, isLoading: false });
    } catch (err) {
      console.error('Error fetching virtual account:', err);
      set({
        account: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load account',
      });
    }
  },

  setAccount: (account: VirtualAccount) => {
    set({ account });
  },

  clearAccount: () => {
    set({ account: null, error: null });
  },
}));
