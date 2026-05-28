import { create } from 'zustand';

export type SelectionMode = 'audio' | 'video';

interface SelectionState {
  mode: SelectionMode | null;
  selectedIds: string[];
  isActive: boolean;
  enter: (mode: SelectionMode, firstId: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
  exit: () => void;
  selectAll: (ids: string[]) => void;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  mode: null,
  selectedIds: [],
  isActive: false,

  enter: (mode, firstId) =>
    set({ mode, selectedIds: [firstId], isActive: true }),

  toggle: (id) => {
    const current = get().selectedIds;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    set({
      selectedIds: next,
      // Auto-exit when nothing remains selected
      isActive: next.length > 0,
      mode: next.length > 0 ? get().mode : null,
    });
  },

  clear: () => set({ selectedIds: [] }),

  exit: () => set({ mode: null, selectedIds: [], isActive: false }),

  selectAll: (ids) => set({ selectedIds: [...ids] }),
}));
