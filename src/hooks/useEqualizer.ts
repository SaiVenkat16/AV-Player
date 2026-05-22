import { useEqualizerStore } from '../store/equalizerStore';

export function useEqualizer(): ReturnType<typeof useEqualizerStore> {
  return useEqualizerStore();
}
