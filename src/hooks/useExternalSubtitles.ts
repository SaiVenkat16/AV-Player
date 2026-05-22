import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { Logger } from '../utils/logger';

export interface ExternalTrack {
  title: string;
  language: string;
  type: string;
  uri: string;
}

export function useExternalSubtitles(videoPath?: string): ExternalTrack[] {
  const [externalTracks, setExternalTracks] = useState<ExternalTrack[]>([]);

  useEffect(() => {
    if (!videoPath) {
      setExternalTracks([]);
      return;
    }

    const checkExternalSubtitles = async () => {
      const lastDot = videoPath.lastIndexOf('.');
      if (lastDot === -1) return;
      const base = videoPath.substring(0, lastDot);
      const srtPath = base + '.srt';
      const vttPath = base + '.vtt';
      const tracks: ExternalTrack[] = [];

      try {
        if (await RNFS.exists(srtPath)) {
          tracks.push({
            title: 'External SRT',
            language: 'en',
            type: 'application/x-subrip',
            uri: Platform.OS === 'android' ? 'file://' + srtPath : srtPath,
          });
        }
        if (await RNFS.exists(vttPath)) {
          tracks.push({
            title: 'External VTT',
            language: 'en',
            type: 'text/vtt',
            uri: Platform.OS === 'android' ? 'file://' + vttPath : vttPath,
          });
        }
      } catch (err) {
        Logger.warn('useExternalSubtitles', 'Failed to check external subtitle files', err);
      }

      setExternalTracks(tracks);
    };

    checkExternalSubtitles();
  }, [videoPath]);

  return externalTracks;
}
