// src/stores/addressStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Address = { id: string; label: string; address: string; };

type AddressState = {
  addresses: Address[];
  selectedId: string | null;
  addAddress: (a: Address) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string | null) => void;
  clearAll: () => void;
  hydrated: boolean;
};

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedId: null,
      hydrated: false,

      addAddress: (a) =>
        set((s) => ({
          addresses: [a, ...s.addresses],
          selectedId: a.id,
        })),

      removeAddress: (id) =>
        set((s) => {
          const next = s.addresses.filter((x) => x.id !== id);
          const sel = s.selectedId === id ? null : s.selectedId;
          return { addresses: next, selectedId: sel };
        }),

      selectAddress: (id) => set(() => ({ selectedId: id })),

      clearAll: () => set({ addresses: [], selectedId: null }),
    }),
    {
      name: 'address-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating address store:', error);
        } else {
          useAddressStore.setState({ hydrated: true });
        }
      },
    }
  )
);