import { create } from 'zustand';
import { AddressService } from '@/services/addresses';
import { ProfileService } from '@/services/profiles';

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

  fetchAddresses: (userId: string) => Promise<void>;
  addAddress: (address: Omit<Address, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  selectAddress: (id: string | null, userId: string) => Promise<void>;
  clearAll: () => void;

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
      const addresses = await AddressService.getByUser(userId);
      const profile = await ProfileService.getProfileAddress(userId);

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
      const data = await AddressService.create(address);

      // Auto-select the new address
      await ProfileService.updateSelectedAddress(address.user_id, data.id);

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
      await AddressService.remove(id);

      set((state) => {
        const wasSelected = state.selectedId === id;
        const newAddresses = state.addresses.filter((a) => a.id !== id);

        if (wasSelected && newAddresses.length > 0) {
          const firstAddress = newAddresses[0];
          ProfileService.updateSelectedAddress(firstAddress.user_id, null)
            .then(() => console.log('Cleared selected address from profile'))
            .catch((err) => console.error('Error clearing selected address:', err));
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
      const dbValue = id === 'profile-address' ? null : id;

      await ProfileService.updateSelectedAddress(userId, dbValue);

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
