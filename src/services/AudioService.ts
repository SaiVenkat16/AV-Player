import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  State,
} from 'react-native-track-player';
import type { Song } from '../types';
import { toFileUri } from '../utils/mediaUri';
import { Logger } from '../utils/logger';

let setupDone = false;
/** Single in-flight setup — concurrent callers await the same work (avoids double setupPlayer crash on Android). */
let setupPromise: Promise<void> | null = null;

export async function setupAudio(): Promise<void> {
  if (setupDone) {
    return;
  }
  if (!setupPromise) {
    setupPromise = (async () => {
      try {
        await TrackPlayer.setupPlayer({
          autoHandleInterruptions: true,
        });
        Logger.debug('AudioService', 'TrackPlayer setup completed');

        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
            Capability.Stop,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
          ],
          android: {
            appKilledPlaybackBehavior:
              AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          },
          progressUpdateEventInterval: 1,
        });
        setupDone = true;
        await TrackPlayer.setVolume(1);
        Logger.info('AudioService', 'Audio setup complete');
      } catch (err) {
        Logger.error('AudioService', 'Failed to setup audio', err);
        setupPromise = null;
        throw err;
      }
    })();
  }
  await setupPromise;
}

function toTrack(s: Song) {
  const url = toFileUri(s.path);
  const artwork = s.albumArt ? toFileUri(s.albumArt) : undefined;
  return {
    id: s.id,
    url,
    title: s.title,
    artist: s.artist,
    album: s.album,
    duration: s.duration > 0 ? s.duration : undefined,
    artwork,
    genre: s.genre,
  };
}

export async function loadQueue(
  songs: Song[],
  startIndex: number,
  shuffle: boolean,
): Promise<void> {
  await setupAudio();
  await TrackPlayer.reset();
  const anchor = songs[Math.max(0, Math.min(songs.length - 1, startIndex))];
  let ordered = [...songs];
  if (shuffle) {
    ordered = shuffleArray(ordered);
  }
  let idx = anchor ? ordered.findIndex(s => s.id === anchor.id) : 0;
  if (idx < 0) {
    idx = 0;
  }
  const start = ordered[idx];
  if (!start) {
    return;
  }
  const tracks = ordered.map(toTrack);
  await TrackPlayer.add(tracks);
  if (idx > 0) {
    await TrackPlayer.skip(idx);
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j] as T;
    arr[j] = t as T;
  }
  return arr;
}

export async function appendToQueue(songs: Song[]): Promise<void> {
  await setupAudio();
  await TrackPlayer.add(songs.map(toTrack));
}

export async function setShuffleMode(
  on: boolean,
  library: Song[],
): Promise<void> {
  await setupAudio();
  try {
    const currentIndex = await TrackPlayer.getActiveTrackIndex();
    if (currentIndex == null || currentIndex < 0) return;
    
    const queue = await TrackPlayer.getQueue();
    if (queue.length <= 1) return;

    // Get indices of tracks after current
    const afterIndices: number[] = [];
    for (let i = queue.length - 1; i > currentIndex; i--) {
      afterIndices.push(i);
    }
    
    if (afterIndices.length === 0) return;

    // Remove tracks after current
    await TrackPlayer.remove(afterIndices);

    // Get the removed tracks
    const afterTracks = afterIndices.reverse().map(i => queue[i]).filter(Boolean);

    // Re-add in shuffled or original order
    let reordered;
    if (on) {
      reordered = [...afterTracks].sort(() => Math.random() - 0.5);
    } else {
      // Restore original library order
      const trackIds = new Set(afterTracks.map(t => t.id));
      const libOrder = library.filter(s => trackIds.has(s.id));
      reordered = libOrder.map(s => afterTracks.find(t => t.id === s.id)!).filter(Boolean);
    }

    if (reordered.length > 0) {
      await TrackPlayer.add(reordered);
    }
  } catch {
    // Silently fail - don't interrupt playback
  }
}

export async function setRepeatMode(
  mode: 'off' | 'all' | 'one',
): Promise<void> {
  await setupAudio();
  if (mode === 'one') {
    await TrackPlayer.setRepeatMode(RepeatMode.Track);
  } else if (mode === 'all') {
    await TrackPlayer.setRepeatMode(RepeatMode.Queue);
  } else {
    await TrackPlayer.setRepeatMode(RepeatMode.Off);
  }
}

export async function crossfadeToNext(crossfadeMs: number): Promise<void> {
  await setupAudio();
  if (crossfadeMs <= 0) {
    await TrackPlayer.skipToNext();
    return;
  }
  const v0 = await TrackPlayer.getVolume();
  const halfDuration = Math.floor(crossfadeMs / 2);
  const steps = 10;
  const stepMs = Math.max(15, Math.floor(halfDuration / steps));

  // Fade out
  for (let i = steps; i >= 0; i -= 1) {
    await TrackPlayer.setVolume((v0 * i) / steps);
    await delay(stepMs);
  }

  // Skip
  await TrackPlayer.skipToNext();

  // Fade in
  for (let i = 0; i <= steps; i += 1) {
    await TrackPlayer.setVolume((v0 * i) / steps);
    await delay(stepMs);
  }
  await TrackPlayer.setVolume(v0);
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export async function getProgressSnapshot(): Promise<{
  position: number;
  duration: number;
  state: State;
}> {
  await setupAudio();
  const pos = await TrackPlayer.getPosition();
  const dur = await TrackPlayer.getDuration();
  const pb = await TrackPlayer.getPlaybackState();
  return { position: pos, duration: dur, state: pb.state };
}
