// src/stores/addressStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Address = {
  id: string;
  user_id: string;
  label: string | null;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  created_at?: string;
  updated_at?: string;
};

type AddressState = {
  addresses: Address[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAddresses: (userId: string) => Promise<void>;
  addAddress: (address: Omit<Address, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  selectAddress: (id: string | null, userId: string) => Promise<void>;
  clearAll: () => void;
  
  // Getters
  getSelectedAddress: () => Address | null;
};

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  selectedId: null,
  loading: false,
  error: null,

  fetchAddresses: async (userId: string) => {
    if (!userId) return;
    
    set({ loading: true, error: null });
    
    try {
      // Fetch addresses
      const { data: addresses, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (addressError) throw addressError;

      // Fetch user's selected address ID from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('selected_address_id, address, city, state')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Determine selectedId:
      // - If selected_address_id is set in DB, use that
      // - If selected_address_id is null but profile has address, set to 'profile-address' for UI
      // - Otherwise null
      let selectedId = profile?.selected_address_id || null;
      
      if (!selectedId && profile?.address && profile?.city && profile?.state) {
        selectedId = 'profile-address';
      }

      set({
        addresses: addresses || [],
        selectedId,
        loading: false,
      });
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      set({ error: error.message, loading: false });
    }
  },

  addAddress: async (address) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert(address)
        .select()
        .single();

      if (error) throw error;

      // Auto-select the new address
      await supabase
        .from('profiles')
        .update({ selected_address_id: data.id })
        .eq('id', address.user_id);

      set((state) => ({
        addresses: [data, ...state.addresses],
        selectedId: data.id,
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error adding address:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  removeAddress: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const wasSelected = state.selectedId === id;
        const newAddresses = state.addresses.filter((a) => a.id !== id);
        
        // If removed address was selected, clear selection in profile
        if (wasSelected && newAddresses.length > 0) {
          const firstAddress = newAddresses[0];
          supabase
            .from('profiles')
            .update({ selected_address_id: null })
            .eq('id', firstAddress.user_id)
            .then(() => console.log('Cleared selected address from profile'));
        }
        
        return {
          addresses: newAddresses,
          selectedId: wasSelected ? null : state.selectedId,
          loading: false,
        };
      });
    } catch (error: any) {
      console.error('Error removing address:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  selectAddress: async (id: string | null, userId: string) => {
    try {
      // Special case: 'profile-address' is not a real address ID
      // Store null in database (use profile as fallback) but keep 'profile-address' in local state for UI
      const dbValue = id === 'profile-address' ? null : id;
      
      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({ selected_address_id: dbValue })
        .eq('id', userId);

      if (error) throw error;

      // Update local state (keep 'profile-address' for UI indication)
      set({ selectedId: id });
    } catch (error: any) {
      console.error('Error selecting address:', error);
      throw error;
    }
  },

  clearAll: () => {
    set({ addresses: [], selectedId: null, loading: false, error: null });
  },

  getSelectedAddress: () => {
    const { addresses, selectedId } = get();
    return addresses.find((a) => a.id === selectedId) || null;
  },
}));