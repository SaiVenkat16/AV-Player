import { create } from 'zustand';

interface SearchState {
  /** Whether the search input is currently open/expanded */
  isSearchOpen: boolean;
  /** Current search query text */
  query: string;
  /** Open search input */
  openSearch: () => void;
  /** Close search and clear query */
  closeSearch: () => void;
  /** Update query text */
  setQuery: (q: string) => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
  isSearchOpen: false,
  query: '',
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false, query: '' }),
  setQuery: (q) => set({ query: q }),
}));
