import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import RNFS from 'react-native-fs';
import type { Album, Artist, Playlist, Song, Video } from '../types';
import { createVideoThumbnail, scanDeviceMedia } from '../services/StorageScanner';
import { toLocalPath } from '../utils/mediaUri';
import { RECENTLY_PLAYED_MAX, STORAGE_KEYS } from '../utils/constants';
import { Logger } from '../utils/logger';
import { mmkvZustandStorage } from '../utils/mmkvStorage';
import { showToast } from './toastStore';

function buildAlbums(songs: Song[]): Album[] {
  const map = new Map<string, Album>();
  for (const s of songs) {
    const raw = s.album?.trim().toLowerCase() || '';
    // Treat empty, "unknown", "unknown album" all as unknown
    const isUnknown = !raw || raw === 'unknown' || raw === 'unknown album';
    // Strip year like "(2017)" or "[2017]" from album name
    const cleanedAlbum = isUnknown ? 'Unknown' : s.album.trim().replace(/\s*[([]\d{4}[)\]]\s*$/, '');
    const key = isUnknown ? '__unknown__' : cleanedAlbum.toLowerCase();
    const cur = map.get(key);
    if (cur) {
      cur.songIds.push(s.id);
      if (!cur.artUri && s.albumArt) {
        cur.artUri = s.albumArt;
      }
    } else {
      map.set(key, {
        id: key,
        name: cleanedAlbum,
        artist: isUnknown ? '' : s.artist,
        artUri: s.albumArt,
        songIds: [s.id],
      });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function buildArtists(songs: Song[]): Artist[] {
  const map = new Map<string, string[]>();
  for (const s of songs) {
    const key = s.artist;
    const arr = map.get(key) ?? [];
    arr.push(s.id);
    map.set(key, arr);
  }
  return [...map.entries()]
    .map(([name, songIds]) => ({
      id: name,
      name,
      songIds,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Bug #15 note: These are intentional module-level singletons.
 * - scanLibraryPromise: deduplicates concurrent scan() calls (prevents double-scan crashes)
 * - thumbnailJobs: deduplicates concurrent thumbnail generation for the same video
 * In development, these persist across hot reloads — restart the app if scans seem stale.
 */
let scanLibraryPromise: Promise<void> | null = null;
const thumbnailJobs = new Map<string, Promise<void>>();

export const LIBRARY_VIDEO_CACHE_VERSION = 2;

type PersistedLibraryState = {
  songs: Song[];
  videos: Video[];
  playlists: Playlist[];
  favorites: string[];
  recentlyPlayed: string[];
  isLoaded: boolean;
  videoCacheVersion: number;
  privateIds: string[];
  privatePin: string | null;
  videoBookmarks: Record<string, { time: number; label: string }[]>;
  videoProgress: Record<string, { position: number; duration: number; watchedAt: number }>;
};

function hasUsableThumbnailUri(uri: string | null | undefined): boolean {
  if (!uri) {
    return false;
  }
  return uri.startsWith('content://') || uri.startsWith('file://') || uri.startsWith('/');
}

export function migrateLibraryPersistedState(
  persistedState: Partial<PersistedLibraryState> | undefined,
  version: number,
): PersistedLibraryState {
  const songs = Array.isArray(persistedState?.songs) ? persistedState.songs : [];
  const videos = Array.isArray(persistedState?.videos) ? persistedState.videos : [];
  const playlists = Array.isArray(persistedState?.playlists)
    ? persistedState.playlists
    : [];
  const favorites = Array.isArray(persistedState?.favorites)
    ? persistedState.favorites
    : [];
  const recentlyPlayed = Array.isArray(persistedState?.recentlyPlayed)
    ? persistedState.recentlyPlayed
    : [];
  const privateIds = Array.isArray(persistedState?.privateIds)
    ? persistedState.privateIds
    : [];
  const privatePin = typeof persistedState?.privatePin === 'string'
    ? persistedState.privatePin
    : null;
  const shouldInvalidateVideoThumbs =
    version < 1 ||
    persistedState?.videoCacheVersion !== LIBRARY_VIDEO_CACHE_VERSION;

  return {
    songs,
    videos: shouldInvalidateVideoThumbs
      ? videos.map((video) => ({ ...video, thumbnailUri: null }))
      : videos,
    playlists,
    favorites,
    recentlyPlayed,
    isLoaded: Boolean(persistedState?.isLoaded),
    videoCacheVersion: LIBRARY_VIDEO_CACHE_VERSION,
    privateIds,
    privatePin,
    videoBookmarks: persistedState?.videoBookmarks ?? {},
    videoProgress: persistedState?.videoProgress ?? {},
  };
}

interface LibraryState {
  songs: Song[];
  videos: Video[];
  playlists: Playlist[];
  favorites: string[];
  recentlyPlayed: string[];
  isScanning: boolean;
  scanProgress: number;
  isLoaded: boolean;
  videoCacheVersion: number;
  scanLibrary: () => Promise<void>;
  setVideoMeta: (id: string, partial: Partial<Video>) => void;
  ensureVideoThumbnail: (
    id: string,
    options?: { force?: boolean },
  ) => Promise<void>;
  invalidateVideoThumbnail: (id: string) => void;
  toggleFavorite: (songId: string) => void;
  addToPlaylist: (playlistId: string, songId: string) => void;
  createPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  addRecentlyPlayed: (songId: string) => void;
  removeSongFromLibrary: (songId: string) => void;
  removeVideoFromLibrary: (videoId: string) => void;
  privateIds: string[];
  privatePin: string | null;
  setPrivatePin: (pin: string | null) => void;
  togglePrivateId: (id: string) => void;
  videoBookmarks: Record<string, { time: number; label: string }[]>;
  addVideoBookmark: (videoId: string, time: number, label: string) => void;
  removeVideoBookmark: (videoId: string, time: number) => void;
  videoProgress: Record<string, { position: number; duration: number; watchedAt: number }>;
  setVideoProgress: (videoId: string, position: number, duration: number) => void;
  clearVideoProgress: (videoId: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      songs: [],
      videos: [],
      playlists: [],
      favorites: [],
      recentlyPlayed: [],
      privateIds: [],
      privatePin: null,
      videoBookmarks: {},
      videoProgress: {},
      isScanning: false,
      scanProgress: 0,
      isLoaded: false,
      videoCacheVersion: LIBRARY_VIDEO_CACHE_VERSION,
      addVideoBookmark: (videoId, time, label) => {
        const current = get().videoBookmarks[videoId] ?? [];
        if (current.some(b => Math.floor(b.time) === Math.floor(time))) return;
        const next = [...current, { time, label }].sort((a, b) => a.time - b.time);
        set({
          videoBookmarks: {
            ...get().videoBookmarks,
            [videoId]: next,
          },
        });
      },
      removeVideoBookmark: (videoId, time) => {
        const current = get().videoBookmarks[videoId] ?? [];
        const next = current.filter(b => b.time !== time);
        set({
          videoBookmarks: {
            ...get().videoBookmarks,
            [videoId]: next,
          },
        });
      },
      setVideoProgress: (videoId, position, duration) => {
        set({
          videoProgress: {
            ...get().videoProgress,
            [videoId]: { position, duration, watchedAt: Date.now() },
          },
        });
      },
      clearVideoProgress: (videoId) => {
        const next = { ...get().videoProgress };
        delete next[videoId];
        set({ videoProgress: next });
      },
      setPrivatePin: (pin) => set({ privatePin: pin }),
      togglePrivateId: (id) => {
        const current = get().privateIds;
        const wasPrivate = current.includes(id);
        const next = wasPrivate
          ? current.filter((x) => x !== id)
          : [...current, id];
        set({ privateIds: next });
        showToast(
          wasPrivate
            ? 'Removed from private folder'
            : 'Moved to private folder',
        );
      },
      scanLibrary: async () => {
        if (scanLibraryPromise) {
          return scanLibraryPromise;
        }
        scanLibraryPromise = (async () => {
          set({ isScanning: true, scanProgress: 0 });
          try {
            const { songs, videos } = await scanDeviceMedia((c) => {
              set({ scanProgress: c });
            });
            // Preserve thumbnails (and other metadata) from previously
            // scanned videos so a pull-to-refresh doesn't trigger a
            // full thumbnail rebuild.
            const prevById = new Map(get().videos.map((v) => [v.id, v]));
            const mergedVideos = videos.map((v) => {
              const prev = prevById.get(v.id);
              if (!prev) return v;
              return {
                ...v,
                thumbnailUri: v.thumbnailUri ?? prev.thumbnailUri,
                duration: v.duration || prev.duration,
                width: v.width || prev.width,
                height: v.height || prev.height,
              };
            });
            // Same for songs — keep enriched metadata (album art etc.)
            const prevSongsById = new Map(get().songs.map((s) => [s.id, s]));
            const mergedSongs = songs.map((s) => {
              const prev = prevSongsById.get(s.id);
              if (!prev) return s;
              return {
                ...s,
                albumArt: s.albumArt ?? prev.albumArt,
                duration: s.duration || prev.duration,
              };
            });
            set({
              songs: mergedSongs,
              videos: mergedVideos,
              isScanning: false,
              isLoaded: true,
              scanProgress: 0,
              videoCacheVersion: LIBRARY_VIDEO_CACHE_VERSION,
            });
          } catch {
            set({ isScanning: false, isLoaded: true, scanProgress: 0 });
          } finally {
            scanLibraryPromise = null;
          }
        })();
        return scanLibraryPromise;
      },
      setVideoMeta: (id, partial) => {
        set({
          videos: get().videos.map((v) => (v.id === id ? { ...v, ...partial } : v)),
        });
      },
      ensureVideoThumbnail: async (id, options) => {
        const video = get().videos.find((entry) => entry.id === id);
        if (!video) {
          return;
        }

        const inFlight = thumbnailJobs.get(id);
        if (inFlight) {
          return inFlight;
        }

        const force = options?.force ?? false;
        const existingThumbPath =
          video.thumbnailUri && hasUsableThumbnailUri(video.thumbnailUri)
            ? toLocalPath(video.thumbnailUri)
            : null;
        if (
          !force &&
          video.thumbnailUri &&
          (video.thumbnailUri.startsWith('content://') ||
            (existingThumbPath != null && (await RNFS.exists(existingThumbPath))))
        ) {
          return;
        }

        const job = (async () => {
          try {
            const next = await createVideoThumbnail(video.path);
            set({
              videos: get().videos.map((entry) =>
                entry.id === id
                  ? {
                      ...entry,
                      thumbnailUri: next.thumbnailUri,
                      width: next.width || entry.width,
                      height: next.height || entry.height,
                      duration: next.duration || entry.duration,
                    }
                  : entry,
              ),
              videoCacheVersion: LIBRARY_VIDEO_CACHE_VERSION,
            });
          } catch (error) {
            Logger.warn(
              'libraryStore',
              `Failed to ensure thumbnail for ${video.path}`,
              error,
            );
            throw error;
          } finally {
            thumbnailJobs.delete(id);
          }
        })();

        thumbnailJobs.set(id, job);
        return job;
      },
      invalidateVideoThumbnail: (id) => {
        set({
          videos: get().videos.map((entry) =>
            entry.id === id ? { ...entry, thumbnailUri: null } : entry,
          ),
          videoCacheVersion: LIBRARY_VIDEO_CACHE_VERSION,
        });
      },
      toggleFavorite: (songId) => {
        const fav = new Set(get().favorites);
        const wasFavorite = fav.has(songId);
        if (wasFavorite) {
          fav.delete(songId);
        } else {
          fav.add(songId);
        }
        set({ favorites: [...fav] });
        showToast(
          wasFavorite ? 'Removed from favorites' : 'Added to favorites',
        );
      },
      addToPlaylist: (playlistId, songId) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId && !p.songIds.includes(songId)
              ? { ...p, songIds: [...p.songIds, songId] }
              : p,
          ),
        });
      },
      createPlaylist: (name) => {
        const id = `pl_${Date.now()}`;
        const pl: Playlist = {
          id,
          name,
          songIds: [],
          createdAt: Date.now(),
        };
        set({ playlists: [...get().playlists, pl] });
      },
      deletePlaylist: (id) => {
        set({ playlists: get().playlists.filter((p) => p.id !== id) });
      },
      removeFromPlaylist: (playlistId, songId) => {
        set({
          playlists: get().playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  songIds: playlist.songIds.filter((id) => id !== songId),
                }
              : playlist,
          ),
        });
      },
      addRecentlyPlayed: (songId) => {
        const rp = get().recentlyPlayed.filter((x) => x !== songId);
        rp.unshift(songId);
        set({ recentlyPlayed: rp.slice(0, RECENTLY_PLAYED_MAX) });
      },
      removeSongFromLibrary: (songId) => {
        set({
          songs: get().songs.filter((s) => s.id !== songId),
          favorites: get().favorites.filter((f) => f !== songId),
          recentlyPlayed: get().recentlyPlayed.filter((r) => r !== songId),
          playlists: get().playlists.map((p) => ({
            ...p,
            songIds: p.songIds.filter((sid) => sid !== songId),
          })),
          privateIds: get().privateIds.filter((id) => id !== songId),
        });
      },
      removeVideoFromLibrary: (videoId) => {
        set({
          videos: get().videos.filter((v) => v.id !== videoId),
          privateIds: get().privateIds.filter((id) => id !== videoId),
        });
      },
    }),
    {
      name: STORAGE_KEYS.libraryMeta,
      storage: createJSONStorage(() => mmkvZustandStorage),
      version: 1,
      migrate: (persistedState, version) =>
        migrateLibraryPersistedState(
          persistedState as Partial<PersistedLibraryState> | undefined,
          version,
        ),
      partialize: (s) => ({
        songs: s.songs,
        videos: s.videos,
        playlists: s.playlists,
        favorites: s.favorites,
        recentlyPlayed: s.recentlyPlayed,
        isLoaded: s.isLoaded,
        videoCacheVersion: s.videoCacheVersion,
        privateIds: s.privateIds,
        privatePin: s.privatePin,
        videoBookmarks: s.videoBookmarks,
        videoProgress: s.videoProgress,
      }),
    },
  ),
);

export function getAlbumsFromSongs(songs: Song[]): Album[] {
  return buildAlbums(songs);
}

export function getArtistsFromSongs(songs: Song[]): Artist[] {
  return buildArtists(songs);
}

export function getMoodMix(songs: Song[], mood: Song['mood']): Song[] {
  return songs.filter((s) => s.mood === mood).slice(0, 200);
}
