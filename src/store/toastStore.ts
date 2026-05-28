import { create } from 'zustand';

interface ToastState {
  message: string | null;
  /** Bumped each time a new toast is shown so the UI re-triggers animations */
  token: number;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>()((set, get) => ({
  message: null,
  token: 0,
  show: (message) => set({ message, token: get().token + 1 }),
  hide: () => set({ message: null }),
}));

/** Convenience helper for non-React code paths */
export function showToast(message: string): void {
  useToastStore.getState().show(message);
}
