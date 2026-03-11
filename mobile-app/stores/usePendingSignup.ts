import { create } from 'zustand';

/**
 * Ephemeral store for pending signup data during OTP verification flow.
 * Data is only kept in memory and auto-clears after 15 minutes
 * so passwords don't linger if a user abandons the OTP screen.
 */

const TTL_MS = 15 * 60 * 1000; // 15 minutes

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

let ttlTimer: ReturnType<typeof setTimeout> | null = null;

export const usePendingSignup = create<PendingSignupStore>((set, get) => ({
  pending: null,

  setPending: (data: PendingSignup) => {
    // Clear any existing TTL timer
    if (ttlTimer) {
      clearTimeout(ttlTimer);
    }

    set({ pending: data });

    // Auto-clear after TTL
    ttlTimer = setTimeout(() => {
      if (get().pending !== null) {
        set({ pending: null });
      }
      ttlTimer = null;
    }, TTL_MS);
  },

  clear: () => {
    if (ttlTimer) {
      clearTimeout(ttlTimer);
      ttlTimer = null;
    }
    set({ pending: null });
  },

  hasPending: () => {
    return get().pending !== null;
  },
}));
