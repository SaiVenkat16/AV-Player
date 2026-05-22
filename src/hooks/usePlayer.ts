import { useEffect, useRef } from 'react';
import TrackPlayer, {
  Event,
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import type { Track } from 'react-native-track-player';
import type { Song } from '../types';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';
import { toFileUri } from '../utils/mediaUri';
import { Logger } from '../utils/logger';

function trackToSong(track: Track | undefined, songs: Song[]): Song | null {
  if (!track?.url) {
    return null;
  }
  const id = typeof track.id === 'string' ? track.id : String(track.id);
  const fromLib = songs.find((s) => s.id === id);
  if (fromLib) {
    return fromLib;
  }
  const path = track.url.replace(/^file:\/\//, '');
  return {
    id,
    path,
    title: track.title ?? 'Unknown',
    artist: track.artist ?? 'Unknown Artist',
    album: track.album ?? 'Unknown Album',
    duration: track.duration ?? 0,
    albumArt: typeof track.artwork === 'string' ? track.artwork : null,
    genre: typeof track.genre === 'string' ? track.genre : '',
    year: '',
    dateAdded: Date.now(),
    mood: 'Chill',
  };
}

function mapQueueToSongs(q: Track[], songs: Song[]): Song[] {
  const out: Song[] = [];
  for (const t of q) {
    const s = trackToSong(t, songs);
    if (s) {
      out.push(s);
    }
  }
  return out;
}

export function usePlayerBootstrap(): void {
  const songs = useLibraryStore((s) => s.songs);
  const track = useActiveTrack();
  const playback = usePlaybackState();
  const { position, duration } = useProgress(250);
  const lastPos = useRef(0);
  const pendingListenSeconds = useRef(0); // Bug #6: accumulate, flush every 5s
  const listenFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRehydrated = useRef(false); // Bug #13: only rehydrate once
  const sleepTimerAt = usePlayerStore((s) => s.sleepTimerAt);
  const sleepTimerTrackId = usePlayerStore((s) => s.sleepTimerTrackId);
  const playState =
    playback && typeof playback === 'object' && 'state' in playback && playback.state !== undefined
      ? playback.state
      : State.None;

  /** Sync track identity and play state — components handle progress locally via useProgress. */
  useEffect(() => {
    const cur = trackToSong(track, songs);
    const { queue } = usePlayerStore.getState();
    const qi = cur ? queue.findIndex((s) => s.id === cur.id) : -1;
    usePlayerStore.setState({
      isPlaying: playState === State.Playing,
      ...(cur ? { currentSong: cur } : {}),
      ...(qi >= 0 ? { queueIndex: qi } : {}),
      ...(qi < 0 && cur && queue.length === 0 ? { queueIndex: 0 } : {}),
    });
  }, [track, songs, playState]);

  /** Rehydrate TrackPlayer from persisted store on startup if player is empty. */
  useEffect(() => {
    // Bug #13 fix: guard with hasRehydrated so this only runs once when library first loads
    if (hasRehydrated.current || songs.length === 0) {
      return;
    }
    hasRehydrated.current = true;
    let alive = true;
    const rehydrate = async () => {
      try {
        const queue = await TrackPlayer.getQueue();
        if (queue.length === 0 && alive) {
          const { currentSong, queue: storedQueue, queueIndex } = usePlayerStore.getState();
          if (storedQueue.length > 0) {
            await TrackPlayer.add(
              storedQueue.map((s) => ({
                id: s.id,
                url: s.path.startsWith('file://') ? s.path : `file://${s.path}`,
                title: s.title,
                artist: s.artist,
                album: s.album,
                duration: s.duration,
                artwork: s.albumArt ? toFileUri(s.albumArt) : undefined,
              })),
            );
            if (queueIndex >= 0 && queueIndex < storedQueue.length) {
              await TrackPlayer.skip(queueIndex);
            }
            Logger.info('usePlayerBootstrap', 'Rehydrated player queue from store');
          } else if (currentSong) {
            await TrackPlayer.add({
              id: currentSong.id,
              url: currentSong.path.startsWith('file://') ? currentSong.path : `file://${currentSong.path}`,
              title: currentSong.title,
              artist: currentSong.artist,
              album: currentSong.album,
              duration: currentSong.duration,
              artwork: currentSong.albumArt ? toFileUri(currentSong.albumArt) : undefined,
            });
            Logger.info('usePlayerBootstrap', 'Rehydrated current song from store');
          }
        }
      } catch (err) {
        Logger.warn('usePlayerBootstrap', 'Rehydration failed', err);
      }
    };

    rehydrate();
    return () => {
      alive = false;
    };
  }, [songs.length]); // Wait for library to be ready (hasRehydrated guard prevents re-runs)

  /** Reconcile queue + active index when track identity or library changes. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = await TrackPlayer.getQueue();
        const idxRaw = await TrackPlayer.getActiveTrackIndex();
        if (cancelled) {
          return;
        }
        const mapped = mapQueueToSongs(q, songs);
        const idx = typeof idxRaw === 'number' && idxRaw >= 0 ? idxRaw : 0;
        
        // Only update store if there is something in the player (to avoid clearing store during startup)
        if (mapped.length > 0) {
          usePlayerStore.setState({
            queue: mapped,
            queueIndex: Math.min(idx, mapped.length - 1),
          });
        }
      } catch {
        /* setupPlayer not finished or service unbound */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [track?.id, songs]);

  useEffect(() => {
    const song = usePlayerStore.getState().currentSong;
    if (!song || playState !== State.Playing) {
      return;
    }
    const delta = Math.max(0, position - lastPos.current);
    lastPos.current = position;
    if (delta > 0 && delta < 5) {
      // Accumulate instead of writing to store every 250ms
      pendingListenSeconds.current += delta;

      // Flush every 5 seconds to avoid GC pressure
      if (!listenFlushTimer.current) {
        listenFlushTimer.current = setTimeout(() => {
          listenFlushTimer.current = null;
          const s = usePlayerStore.getState().currentSong;
          const secs = pendingListenSeconds.current;
          pendingListenSeconds.current = 0;
          if (s && secs > 0) {
            useSettingsStore.getState().recordListenSeconds(s.id, s.artist, secs);
          }
        }, 5000);
      }
    }
  }, [position, playState]);

  // Flush on unmount to avoid losing data
  useEffect(() => {
    return () => {
      if (listenFlushTimer.current) {
        clearTimeout(listenFlushTimer.current);
        listenFlushTimer.current = null;
        const song = usePlayerStore.getState().currentSong;
        const secs = pendingListenSeconds.current;
        pendingListenSeconds.current = 0;
        if (song && secs > 0) {
          useSettingsStore.getState().recordListenSeconds(song.id, song.artist, secs);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (sleepTimerTrackId && track?.id != null) {
      const activeId = typeof track.id === 'string' ? track.id : String(track.id);
      if (activeId !== sleepTimerTrackId) {
        usePlayerStore.getState().clearSleepTimer();
      }
    }
  }, [sleepTimerTrackId, track?.id]);

  useEffect(() => {
    if (sleepTimerAt == null) {
      return;
    }

    const pauseForSleepTimer = async () => {
      try {
        await TrackPlayer.pause();
      } catch (error) {
        Logger.warn('usePlayerBootstrap', 'Failed to pause for sleep timer', error);
      } finally {
        usePlayerStore.setState({ isPlaying: false });
        usePlayerStore.getState().clearSleepTimer();
      }
    };

    const delayMs = sleepTimerAt - Date.now();
    if (delayMs <= 0) {
      pauseForSleepTimer();
      return;
    }

    const timeoutId = setTimeout(() => {
      pauseForSleepTimer();
    }, delayMs);
    return () => clearTimeout(timeoutId);
  }, [sleepTimerAt]);

  useEffect(() => {
    if (
      sleepTimerTrackId == null ||
      track?.id == null ||
      playState !== State.Playing ||
      duration <= 0
    ) {
      return;
    }

    const activeId = typeof track.id === 'string' ? track.id : String(track.id);
    if (activeId !== sleepTimerTrackId) {
      return;
    }

    if (duration - position > 0.75) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await TrackPlayer.pause();
      } catch (error) {
        Logger.warn('usePlayerBootstrap', 'Failed to pause at end-of-song sleep timer', error);
      } finally {
        if (!cancelled) {
          usePlayerStore.setState({ isPlaying: false });
          usePlayerStore.getState().clearSleepTimer();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [duration, playState, position, sleepTimerTrackId, track?.id]);

  useTrackPlayerEvents([Event.PlaybackQueueEnded], async () => {
    const cur = usePlayerStore.getState().currentSong;
    const q = usePlayerStore.getState().queue;
    if (!cur || q.length === 0) {
      return;
    }
    const sameAlbum = songs.filter((s) => s.album === cur.album && s.id !== cur.id);
    const sameArtist = songs.filter(
      (s) => s.artist === cur.artist && s.album !== cur.album && s.id !== cur.id,
    );
    const sameGenre = songs.filter(
      (s) =>
        s.genre &&
        cur.genre &&
        s.genre === cur.genre &&
        s.id !== cur.id &&
        !sameAlbum.includes(s) &&
        !sameArtist.includes(s),
    );
    const predict = [...sameAlbum, ...sameArtist, ...sameGenre].slice(0, 12);
    if (predict.length === 0) {
      return;
    }
    let label = 'You might like';
    if (sameAlbum.length) {
      label = 'From same album';
    } else if (sameArtist.length) {
      label = 'Same artist';
    } else if (sameGenre.length) {
      label = 'Similar genre';
    }
    usePlayerStore.setState({ predictionLabel: label });
    await TrackPlayer.add(
      predict.map((s) => ({
        id: s.id,
        url: s.path.startsWith('file://') ? s.path : `file://${s.path}`,
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration,
        artwork: s.albumArt ? toFileUri(s.albumArt) : undefined,
      })),
    );
  });
}
