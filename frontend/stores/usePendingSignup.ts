import { create } from 'zustand';

/**
 * Ephemeral store for pending signup data during OTP verification flow
 * This data is only kept in memory and cleared after successful verification
 * For sensitive data like password, consider using SecureStore if cold-start persistence is needed
 */

interface PendingSignup {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'vendor';
}

interface PendingSignupStore {
  pending: PendingSignup | null;
  setPending: (data: PendingSignup) => void;
  clear: () => void;
  hasPending: () => boolean;
}

export const usePendingSignup = create<PendingSignupStore>((set, get) => ({
  pending: null,

  setPending: (data: PendingSignup) => {
    console.log('💾 Storing pending signup for:', data.email);
    set({ pending: data });
  },

  clear: () => {
    console.log('🧹 Clearing pending signup data');
    set({ pending: null });
  },

  hasPending: () => {
    return get().pending !== null;
  },
}));
