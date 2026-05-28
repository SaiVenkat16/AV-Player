import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { VisualizerStyle } from '../types';
import { GESTURE_HINT_KEYS, STORAGE_KEYS } from '../utils/constants';
import { mmkv, mmkvZustandStorage } from '../utils/mmkvStorage';

interface SettingsState {
  crossfadeMs: number;
  skipSilence: boolean;
  visualizerStyle: VisualizerStyle;
  gestureHintsMusic: boolean;
  gestureHintsVideo: boolean;
  fadeOutLast30: boolean;
  videoFolderSortMode: 'name' | 'size' | 'duration' | 'recent';
  videoTabViewMode: 'grid' | 'list';
  setCrossfadeMs: (ms: number) => void;
  setSkipSilence: (v: boolean) => void;
  setVisualizerStyle: (s: VisualizerStyle) => void;
  setGestureHintsMusic: (v: boolean) => void;
  setGestureHintsVideo: (v: boolean) => void;
  setFadeOutLast30: (v: boolean) => void;
  setVideoFolderSortMode: (m: SettingsState['videoFolderSortMode']) => void;
  setVideoTabViewMode: (m: SettingsState['videoTabViewMode']) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      crossfadeMs: 0,
      skipSilence: false,
      visualizerStyle: 'rings',
      gestureHintsMusic: true,
      gestureHintsVideo: true,
      fadeOutLast30: false,
      videoFolderSortMode: 'name',
      videoTabViewMode: 'grid',
      setCrossfadeMs: (ms) => set({ crossfadeMs: Math.max(0, Math.min(8000, ms)) }),
      setSkipSilence: (v) => set({ skipSilence: v }),
      setVisualizerStyle: (s) => set({ visualizerStyle: s }),
      setGestureHintsMusic: (v) => set({ gestureHintsMusic: v }),
      setGestureHintsVideo: (v) => set({ gestureHintsVideo: v }),
      setFadeOutLast30: (v) => set({ fadeOutLast30: v }),
      setVideoFolderSortMode: (m) => set({ videoFolderSortMode: m }),
      setVideoTabViewMode: (m) => set({ videoTabViewMode: m }),
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => mmkvZustandStorage),
      partialize: (s) => ({
        crossfadeMs: s.crossfadeMs,
        skipSilence: s.skipSilence,
        visualizerStyle: s.visualizerStyle,
        gestureHintsMusic: s.gestureHintsMusic,
        gestureHintsVideo: s.gestureHintsVideo,
        fadeOutLast30: s.fadeOutLast30,
        videoFolderSortMode: s.videoFolderSortMode,
        videoTabViewMode: s.videoTabViewMode,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsState> | undefined;
        return {
          ...current,
          ...p,
        };
      },
    },
  ),
);

export async function loadGestureHintFlags(): Promise<{
  music: boolean;
  video: boolean;
}> {
  const m = mmkv.getString(GESTURE_HINT_KEYS.musicNowPlaying);
  const v = mmkv.getString(GESTURE_HINT_KEYS.videoPlayer);
  return {
    music: m !== '0',
    video: v !== '0',
  };
}

export async function persistGestureHintMusic(visible: boolean): Promise<void> {
  mmkv.set(GESTURE_HINT_KEYS.musicNowPlaying, visible ? '1' : '0');
}

export async function persistGestureHintVideo(visible: boolean): Promise<void> {
  mmkv.set(GESTURE_HINT_KEYS.videoPlayer, visible ? '1' : '0');
}
