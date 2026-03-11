import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProductDraft {
  name: string;
  category: string;
  price: string;
  quantity: string;
  unit: string;
  description: string;
  isOrganic: boolean;
  minimumOrderQty: string;
  hasIncrement: boolean;
  orderIncrement: string;
  hasBulkDiscount: boolean;
  discountTier1Qty: string;
  discountTier1Percent: string;
  discountTier2Qty: string;
  discountTier2Percent: string;
  images: string[];
  location: { lat: number; lng: number; address: string } | null;
  updatedAt: number;
}

const EMPTY_DRAFT: ProductDraft = {
  name: '',
  category: '',
  price: '',
  quantity: '',
  unit: 'kg',
  description: '',
  isOrganic: false,
  minimumOrderQty: '1',
  hasIncrement: false,
  orderIncrement: '1',
  hasBulkDiscount: false,
  discountTier1Qty: '',
  discountTier1Percent: '',
  discountTier2Qty: '',
  discountTier2Percent: '',
  images: [],
  location: null,
  updatedAt: 0,
};

const DRAFT_KEY = 'product_draft';
const SMART_DEFAULTS_KEY = 'product_smart_defaults';

interface SmartDefaults {
  unit: string;
  category: string;
  location: { lat: number; lng: number; address: string } | null;
}

interface DraftStoreState {
  draft: ProductDraft;
  smartDefaults: SmartDefaults | null;
  hasDraft: boolean;
  setDraft: (draft: Partial<ProductDraft>) => void;
  saveDraftToStorage: () => Promise<void>;
  loadDraftFromStorage: () => Promise<void>;
  clearDraft: () => Promise<void>;
  saveSmartDefaults: (defaults: SmartDefaults) => Promise<void>;
  loadSmartDefaults: () => Promise<SmartDefaults | null>;
}

export const useDraftStore = create<DraftStoreState>((set, get) => ({
  draft: { ...EMPTY_DRAFT },
  smartDefaults: null,
  hasDraft: false,

  setDraft: (partial) => {
    set((state) => ({
      draft: { ...state.draft, ...partial, updatedAt: Date.now() },
      hasDraft: true,
    }));
  },

  saveDraftToStorage: async () => {
    try {
      const { draft } = get();
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  },

  loadDraftFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed: ProductDraft = JSON.parse(raw);
        const hasContent = parsed.name || parsed.price || parsed.images.length > 0;
        set({ draft: parsed, hasDraft: !!hasContent });
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  },

  clearDraft: async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
      set({ draft: { ...EMPTY_DRAFT }, hasDraft: false });
    } catch (e) {
      console.error('Failed to clear draft:', e);
    }
  },

  saveSmartDefaults: async (defaults) => {
    try {
      await AsyncStorage.setItem(SMART_DEFAULTS_KEY, JSON.stringify(defaults));
      set({ smartDefaults: defaults });
    } catch (e) {
      console.error('Failed to save smart defaults:', e);
    }
  },

  loadSmartDefaults: async () => {
    try {
      const raw = await AsyncStorage.getItem(SMART_DEFAULTS_KEY);
      if (raw) {
        const parsed: SmartDefaults = JSON.parse(raw);
        set({ smartDefaults: parsed });
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('Failed to load smart defaults:', e);
      return null;
    }
  },
}));
