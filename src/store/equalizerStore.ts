import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { EqualizerService } from '../services/EqualizerService';
import { STORAGE_KEYS } from '../utils/constants';
import { mmkv, mmkvZustandStorage } from '../utils/mmkvStorage';

export interface EqBand {
  hz: number;
  gain: number;
}

interface EqualizerState {
  isEnabled: boolean;
  bands: EqBand[];
  activePreset: string;
  bassBoost: boolean;
  surroundMode: boolean;
  setBandGain: (bandIndex: number, gain: number) => void;
  applyPreset: (presetName: string) => void;
  toggleBassBoost: () => void;
  toggleSurround: () => void;
  saveCustomPreset: () => void;
  setEnabled: (v: boolean) => void;
}

const defaultBands: EqBand[] = [
  { hz: 60, gain: 0 },
  { hz: 250, gain: 0 },
  { hz: 1000, gain: 0 },
  { hz: 4000, gain: 0 },
  { hz: 16000, gain: 0 },
];

async function pushToDevice(bands: EqBand[], bass: boolean, sur: boolean): Promise<void> {
  const gains = bands.map((b) => b.gain);
  await EqualizerService.applyBandsDb(gains);
  EqualizerService.setBassBoost(bass);
  EqualizerService.setSurround(sur);
}

export const useEqualizerStore = create<EqualizerState>()(
  persist(
    (set, get) => ({
      isEnabled: true,
      bands: defaultBands,
      activePreset: 'Normal',
      bassBoost: false,
      surroundMode: false,
      setEnabled: (v) => {
        set({ isEnabled: v });
        if (!v) {
          EqualizerService.reset();
          EqualizerService.setBassBoost(false);
          EqualizerService.setSurround(false);
        } else {
          const { bands, bassBoost, surroundMode } = get();
          pushToDevice(bands, bassBoost, surroundMode);
        }
      },
      setBandGain: (bandIndex, gain) => {
        const g = Math.max(-12, Math.min(12, gain));
        const bands = get().bands.map((b, i) =>
          i === bandIndex ? { ...b, gain: g } : b,
        );
        set({ bands, activePreset: 'Custom' });
        if (get().isEnabled) {
          pushToDevice(bands, get().bassBoost, get().surroundMode);
        }
      },
      applyPreset: (presetName) => {
        const preset = EqualizerService.presets[presetName];
        const base = preset ?? EqualizerService.presets.Normal;
        const bands = get().bands.map((b, i) => ({
          ...b,
          gain: base[i] ?? 0,
        }));
        set({ bands, activePreset: presetName });
        if (get().isEnabled) {
          pushToDevice(bands, get().bassBoost, get().surroundMode);
        }
      },
      toggleBassBoost: () => {
        const bassBoost = !get().bassBoost;
        set({ bassBoost });
        EqualizerService.setBassBoost(bassBoost);
      },
      toggleSurround: () => {
        const surroundMode = !get().surroundMode;
        set({ surroundMode });
        EqualizerService.setSurround(surroundMode);
      },
      saveCustomPreset: () => {
        mmkv.set(
          `${STORAGE_KEYS.eq}:custom`,
          JSON.stringify(get().bands.map((b) => b.gain)),
        );
        set({ activePreset: 'Custom' });
      },
    }),
    {
      name: STORAGE_KEYS.eq,
      storage: createJSONStorage(() => mmkvZustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.isEnabled) {
          pushToDevice(state.bands, state.bassBoost, state.surroundMode);
        }
      },
    },
  ),
);
