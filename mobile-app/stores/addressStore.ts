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
  is_default: boolean;
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
  selectAddress: (id: string | null) => void;
  setDefaultAddress: (id: string) => Promise<void>;
  clearAll: () => void;
  
  // Getters
  getSelectedAddress: () => Address | null;
  getDefaultAddress: () => Address | null;
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
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const addresses = data || [];
      const defaultAddress = addresses.find((a) => a.is_default);
      
      set({
        addresses,
        selectedId: get().selectedId || defaultAddress?.id || null,
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
      // If this is marked as default, unset other defaults first
      if (address.is_default) {
        const { error: updateError } = await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', address.user_id)
          .eq('is_default', true);

        if (updateError) throw updateError;
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert(address)
        .select()
        .single();

      if (error) throw error;

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
        const newAddresses = state.addresses.filter((a) => a.id !== id);
        const newSelectedId = state.selectedId === id ? null : state.selectedId;
        
        return {
          addresses: newAddresses,
          selectedId: newSelectedId,
          loading: false,
        };
      });
    } catch (error: any) {
      console.error('Error removing address:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  selectAddress: (id: string | null) => {
    set({ selectedId: id });
  },

  setDefaultAddress: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const address = get().addresses.find((a) => a.id === id);
      if (!address) throw new Error('Address not found');

      // Unset current default
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', address.user_id)
        .eq('is_default', true);

      // Set new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        addresses: state.addresses.map((a) =>
          a.id === id ? { ...a, is_default: true } : { ...a, is_default: false }
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error setting default address:', error);
      set({ error: error.message, loading: false });
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

  getDefaultAddress: () => {
    const { addresses } = get();
    return addresses.find((a) => a.is_default) || null;
  },
}));