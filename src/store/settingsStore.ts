import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { VisualizerStyle } from '../types';
import { GESTURE_HINT_KEYS, STORAGE_KEYS } from '../utils/constants';

export interface ListeningStats {
  totalSeconds: number;
  topSongIdsWeek: string[];
  songSecondsWeek: Record<string, number>;
  artistSecondsWeek: Record<string, number>;
  topArtistName: string;
  streakDays: number;
  lastListenDay: string;
  weekdaySeconds: number[];
}

interface SettingsState {
  crossfadeMs: number;
  skipSilence: boolean;
  visualizerStyle: VisualizerStyle;
  gestureHintsMusic: boolean;
  gestureHintsVideo: boolean;
  fadeOutLast30: boolean;
  stats: ListeningStats;
  setCrossfadeMs: (ms: number) => void;
  setSkipSilence: (v: boolean) => void;
  setVisualizerStyle: (s: VisualizerStyle) => void;
  setGestureHintsMusic: (v: boolean) => void;
  setGestureHintsVideo: (v: boolean) => void;
  setFadeOutLast30: (v: boolean) => void;
  recordListenSeconds: (songId: string, artist: string, seconds: number) => void;
}

const emptyStats: ListeningStats = {
  totalSeconds: 0,
  topSongIdsWeek: [],
  songSecondsWeek: {},
  artistSecondsWeek: {},
  topArtistName: '',
  streakDays: 0,
  lastListenDay: '',
  weekdaySeconds: [0, 0, 0, 0, 0, 0, 0],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      crossfadeMs: 0,
      skipSilence: false,
      visualizerStyle: 'rings',
      gestureHintsMusic: true,
      gestureHintsVideo: true,
      fadeOutLast30: false,
      stats: emptyStats,
      setCrossfadeMs: (ms) => set({ crossfadeMs: Math.max(0, Math.min(8000, ms)) }),
      setSkipSilence: (v) => set({ skipSilence: v }),
      setVisualizerStyle: (s) => set({ visualizerStyle: s }),
      setGestureHintsMusic: (v) => set({ gestureHintsMusic: v }),
      setGestureHintsVideo: (v) => set({ gestureHintsVideo: v }),
      setFadeOutLast30: (v) => set({ fadeOutLast30: v }),
      recordListenSeconds: (songId, artist, seconds) => {
        if (seconds <= 0) {
          return;
        }
        const { stats } = get();
        const d = new Date();
        const dayKey = d.toISOString().slice(0, 10);
        const wd = d.getDay();
        const nextWeekday = [...stats.weekdaySeconds];
        nextWeekday[wd] = (nextWeekday[wd] ?? 0) + seconds;
        const nextSongSeconds = {
          ...stats.songSecondsWeek,
          [songId]: (stats.songSecondsWeek[songId] ?? 0) + seconds,
        };
        const nextArtistSeconds = {
          ...stats.artistSecondsWeek,
          [artist]: (stats.artistSecondsWeek[artist] ?? 0) + seconds,
        };
        const topSongIdsWeek = Object.entries(nextSongSeconds)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id]) => id);
        const topArtistName =
          Object.entries(nextArtistSeconds).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
        let streak = stats.streakDays;
        if (stats.lastListenDay) {
          const prev = new Date(stats.lastListenDay);
          const diff = Math.floor(
            (d.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000),
          );
          if (diff === 1) {
            streak += 1;
          } else if (diff > 1) {
            streak = 1;
          }
        } else {
          streak = 1;
        }
        set({
          stats: {
            totalSeconds: stats.totalSeconds + seconds,
            topSongIdsWeek,
            songSecondsWeek: nextSongSeconds,
            artistSecondsWeek: nextArtistSeconds,
            topArtistName,
            streakDays: streak,
            lastListenDay: dayKey,
            weekdaySeconds: nextWeekday,
          },
        });
      },
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        crossfadeMs: s.crossfadeMs,
        skipSilence: s.skipSilence,
        visualizerStyle: s.visualizerStyle,
        gestureHintsMusic: s.gestureHintsMusic,
        gestureHintsVideo: s.gestureHintsVideo,
        fadeOutLast30: s.fadeOutLast30,
        stats: s.stats,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsState> | undefined;
        return {
          ...current,
          ...p,
          stats: p?.stats
            ? {
                ...emptyStats,
                ...p.stats,
                weekdaySeconds: p.stats.weekdaySeconds ?? emptyStats.weekdaySeconds,
                songSecondsWeek: p.stats.songSecondsWeek ?? emptyStats.songSecondsWeek,
                artistSecondsWeek:
                  p.stats.artistSecondsWeek ?? emptyStats.artistSecondsWeek,
              }
            : current.stats,
        };
      },
    },
  ),
);

export async function loadGestureHintFlags(): Promise<{
  music: boolean;
  video: boolean;
}> {
  const [m, v] = await Promise.all([
    AsyncStorage.getItem(GESTURE_HINT_KEYS.musicNowPlaying),
    AsyncStorage.getItem(GESTURE_HINT_KEYS.videoPlayer),
  ]);
  return {
    music: m !== '0',
    video: v !== '0',
  };
}

export async function persistGestureHintMusic(visible: boolean): Promise<void> {
  await AsyncStorage.setItem(GESTURE_HINT_KEYS.musicNowPlaying, visible ? '1' : '0');
}

export async function persistGestureHintVideo(visible: boolean): Promise<void> {
  await AsyncStorage.setItem(GESTURE_HINT_KEYS.videoPlayer, visible ? '1' : '0');
}
