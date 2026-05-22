import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import TrackPlayer, { State } from 'react-native-track-player';
import type { Song } from '../types';
import {
  appendToQueue,
  crossfadeToNext,
  loadQueue,
  setRepeatMode,
  setShuffleMode,
  setupAudio,
} from '../services/AudioService';
import { ensurePlaybackNotificationPermission } from '../services/PermissionService';
import { useSettingsStore } from './settingsStore';
import { STORAGE_KEYS } from '../utils/constants';

export type RepeatModeSetting = 'off' | 'all' | 'one';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  queue: Song[];
  queueIndex: number;
  shuffleMode: boolean;
  repeatMode: RepeatModeSetting;
  isPlayerVisible: boolean;
  isMiniPlayer: boolean;
  predictionLabel: string;
  sleepTimerAt: number | null;
  sleepTimerTrackId: string | null;
  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seekTo: (position: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (from: number, to: number) => void;
  setPlayerVisible: (v: boolean, mini?: boolean) => void;
  setSleepTimerMinutes: (minutes: number | null) => void;
  setSleepTimerEndOfTrack: (enabled: boolean) => void;
  clearSleepTimer: () => void;
  syncFromTrackPlayer: (payload: {
    track: Song | null;
    position: number;
    duration: number;
    state: State;
    queue: Song[];
    index: number;
  }) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => {
      /**
       * Bug #14 note: syncQueueState is intentionally defined inside create() because it
       * captures `set` and `get` from Zustand's factory. Moving it outside would require
       * passing those as arguments which adds complexity without benefit.
       */
      const syncQueueState = async (queue: Song[]) => {
        const [activeTrack, activeIndexRaw] = await Promise.all([
          TrackPlayer.getActiveTrack(),
          TrackPlayer.getActiveTrackIndex(),
        ]);
        const activeId =
          activeTrack?.id == null ? null : typeof activeTrack.id === 'string' ? activeTrack.id : String(activeTrack.id);
        const fallbackIndex =
          typeof activeIndexRaw === 'number' && activeIndexRaw >= 0
            ? activeIndexRaw
            : activeId
              ? queue.findIndex((song) => song.id === activeId)
              : 0;
        const queueIndex = queue.length > 0 ? Math.max(0, fallbackIndex) : 0;
        const currentSong =
          activeId != null
            ? queue.find((song) => song.id === activeId) ?? queue[queueIndex] ?? null
            : queue[queueIndex] ?? null;
        set({
          queue,
          queueIndex,
          currentSong,
          ...(queue.length === 0
            ? {
                isPlaying: false,
                isPlayerVisible: false,
                isMiniPlayer: true,
                predictionLabel: '',
              }
            : {}),
        });
      };

      return ({
      currentSong: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      volume: 1,
      queue: [],
      queueIndex: 0,
      shuffleMode: false,
      repeatMode: 'off',
      isPlayerVisible: false,
      isMiniPlayer: true,
      predictionLabel: '',
      sleepTimerAt: null,
      sleepTimerTrackId: null,
      playSong: async (song, queue) => {
        const lib = queue ?? get().queue;
        const list = lib.length > 0 ? lib : [song];
        const idx = Math.max(0, list.findIndex((s) => s.id === song.id));
        await setupAudio();
        await ensurePlaybackNotificationPermission();
        await loadQueue(list, idx, get().shuffleMode);
        await setRepeatMode(get().repeatMode);
        await TrackPlayer.play();
        set({
          currentSong: song,
          queue: list,
          queueIndex: idx,
          isPlayerVisible: true,
          isMiniPlayer: false,
          isPlaying: true,
          predictionLabel: '',
        });
      },
      togglePlay: async () => {
        await setupAudio();
        const st = await TrackPlayer.getPlaybackState();
        if (st.state === State.Playing) {
          await TrackPlayer.pause();
        } else {
          await ensurePlaybackNotificationPermission();
          await TrackPlayer.play();
        }
      },
      nextSong: async () => {
        await setupAudio();
        const cf = useSettingsStore.getState().crossfadeMs;
        if (cf > 0) {
          await crossfadeToNext(cf);
        } else {
          await TrackPlayer.skipToNext();
        }
      },
      prevSong: async () => {
        await setupAudio();
        await TrackPlayer.skipToPrevious();
      },
      seekTo: async (position) => {
        await setupAudio();
        await TrackPlayer.seekTo(position);
      },
      setVolume: async (volume) => {
        const v = Math.max(0, Math.min(1, volume));
        await setupAudio();
        await TrackPlayer.setVolume(v);
        set({ volume: v });
      },
      toggleShuffle: async () => {
        const next = !get().shuffleMode;
        set({ shuffleMode: next });
        const cur = get().currentSong;
        const q = get().queue;
        if (cur && q.length > 0) {
          await setShuffleMode(next, q);
        }
      },
      cycleRepeat: async () => {
        const order: RepeatModeSetting[] = ['off', 'all', 'one'];
        const cur = get().repeatMode;
        const ni = (order.indexOf(cur) + 1) % order.length;
        const next = order[ni] ?? 'off';
        set({ repeatMode: next });
        await setRepeatMode(next);
      },
      addToQueue: async (song) => {
        set({ queue: [...get().queue, song] });
        await appendToQueue([song]);
      },
      removeFromQueue: async (index) => {
        await setupAudio();
        const q = get().queue;
        if (index < 0 || index >= q.length) {
          return;
        }
        await TrackPlayer.remove(index);
        const next = [...q];
        next.splice(index, 1);
        await syncQueueState(next);
      },
      clearQueue: async () => {
        await setupAudio();
        await TrackPlayer.reset();
        set({
          currentSong: null,
          isPlaying: false,
          position: 0,
          duration: 0,
          queue: [],
          queueIndex: 0,
          isPlayerVisible: false,
          isMiniPlayer: true,
          predictionLabel: '',
        });
      },
      reorderQueue: async (from, to) => {
        await setupAudio();
        const q = [...get().queue];
        if (from < 0 || to < 0 || from >= q.length || to >= q.length) {
          return;
        }
        await TrackPlayer.move(from, to);
        const [item] = q.splice(from, 1);
        if (!item) {
          return;
        }
        q.splice(to, 0, item);
        await syncQueueState(q);
      },
      setPlayerVisible: (v, mini) => {
        set({
          isPlayerVisible: v,
          isMiniPlayer: mini ?? get().isMiniPlayer,
        });
      },
      setSleepTimerMinutes: (minutes) => {
        set({
          sleepTimerAt:
            minutes == null ? null : Date.now() + Math.max(1, minutes) * 60 * 1000,
          sleepTimerTrackId: null,
        });
      },
      setSleepTimerEndOfTrack: (enabled) => {
        set({
          sleepTimerTrackId: enabled ? get().currentSong?.id ?? null : null,
          sleepTimerAt: null,
        });
      },
      clearSleepTimer: () => {
        set({ sleepTimerAt: null, sleepTimerTrackId: null });
      },
      syncFromTrackPlayer: ({
        track,
        position,
        duration,
        state,
        queue,
        index,
      }) => {
        set({
          currentSong: track,
          position,
          duration,
          isPlaying: state === State.Playing,
          queue,
          queueIndex: index,
        });
      },
    });
  },
    {
      name: STORAGE_KEYS.playerState,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        currentSong: s.currentSong,
        queue: s.queue,
        queueIndex: s.queueIndex,
        shuffleMode: s.shuffleMode,
        repeatMode: s.repeatMode,
        volume: s.volume,
      }),
    },
  ),
);
