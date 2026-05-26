import { useLibraryStore } from '../store/libraryStore';

export function useLibrary() {
  return useLibraryStore();
}
