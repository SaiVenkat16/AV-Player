import { useLibraryStore } from '../store/libraryStore';

export function useLibrary(): ReturnType<typeof useLibraryStore> {
  return useLibraryStore();
}
