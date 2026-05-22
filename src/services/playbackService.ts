import TrackPlayer, { Event, State } from 'react-native-track-player';
import { Logger } from '../utils/logger';

let ducked = false;
let savedVolume = 1;

export async function PlaybackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    try {
      await TrackPlayer.play();
    } catch (err) {
      Logger.warn('PlaybackService', 'Failed to play from remote control', err);
    }
  });
  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    try {
      await TrackPlayer.pause();
    } catch (err) {
      Logger.warn(
        'PlaybackService',
        'Failed to pause from remote control',
        err,
      );
    }
  });
  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    try {
      await TrackPlayer.skipToNext();
    } catch (err) {
      Logger.warn(
        'PlaybackService',
        'Failed to skip next from remote control',
        err,
      );
    }
  });
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    try {
      await TrackPlayer.skipToPrevious();
    } catch (err) {
      Logger.warn(
        'PlaybackService',
        'Failed to skip previous from remote control',
        err,
      );
    }
  });
  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    try {
      await TrackPlayer.stop();
    } catch (err) {
      Logger.warn('PlaybackService', 'Failed to stop from remote control', err);
    }
  });
  TrackPlayer.addEventListener(Event.RemoteSeek, async ({ position }) => {
    try {
      await TrackPlayer.seekTo(position);
    } catch (err) {
      Logger.warn('PlaybackService', 'Failed to seek from remote control', err);
    }
  });
  TrackPlayer.addEventListener(Event.RemoteDuck, async e => {
    try {
      if (e.permanent) {
        await TrackPlayer.stop();
        return;
      }
      if (e.paused) {
        if (!ducked) {
          const v = await TrackPlayer.getVolume();
          savedVolume = v;
          ducked = true;
          await TrackPlayer.setVolume(0.3);
        }
        await TrackPlayer.pause();
      } else if (ducked) {
        await TrackPlayer.setVolume(savedVolume);
        ducked = false;
        const st = await TrackPlayer.getPlaybackState();
        if (st.state !== State.Playing) {
          await TrackPlayer.play();
        }
      }
    } catch (err) {
      Logger.warn('PlaybackService', 'Failed to handle duck event', err);
    }
  });
}
