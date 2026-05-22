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
  const curState = await TrackPlayer.getPlaybackState();
  const curPosition = await TrackPlayer.getPosition();
  const cur = await TrackPlayer.getActiveTrack();
  if (!cur?.id) {
    return;
  }
  const idx = library.findIndex(s => s.id === cur.id);
  if (idx < 0) {
    return;
  }
  await loadQueue(library, idx, on);
  await TrackPlayer.seekTo(curPosition);
  
  const wasPlaying = curState.state === State.Playing || curState.state === State.Buffering;
  if (wasPlaying) {
    await TrackPlayer.play();
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
