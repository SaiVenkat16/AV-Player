import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import type { Song, Video } from '../types';
import { AUDIO_EXTENSIONS, VIDEO_EXTENSIONS } from '../utils/constants';
import { extractAudioMetadata } from './MetadataService';
import { requestMediaLibraryPermission } from './PermissionService';
import { createVideoThumbnail as createVideoThumbnailFromMetadata } from './VideoMetadataService';
import { Logger } from '../utils/logger';


function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  if (i < 0) {
    return '';
  }
  return name.slice(i).toLowerCase();
}

async function extractVideoMetadata(
  path: string,
  fileName: string,
): Promise<Omit<Video, 'id' | 'path'>> {
  let sizeBytes = 0;
  try {
    const st = await RNFS.stat(path);
    sizeBytes = Number(st.size);
  } catch {
    sizeBytes = 0;
  }
  const title = fileName.replace(/\.[^/.]+$/, '') || 'Video';
  // Bug #11 fix: skip thumbnail during scan — generate lazily via ensureVideoThumbnail when opened
  return {
    title,
    duration: 0,
    width: 0,
    height: 0,
    sizeBytes,
    thumbnailUri: null,
  };
}

export async function createVideoThumbnail(path: string): Promise<{
  thumbnailUri: string;
  width: number;
  height: number;
  duration: number;
}> {
  return createVideoThumbnailFromMetadata(path);
}

export async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  return requestMediaLibraryPermission();
}

const CONCURRENCY_LIMIT = 5;

export async function scanDeviceMedia(
  onProgress: (count: number) => void,
): Promise<{ songs: Song[]; videos: Video[] }> {
  const songs: Song[] = [];
  const videos: Video[] = [];
  const seenPaths = new Set<string>();
  const searchPaths = [
    RNFS.ExternalStorageDirectoryPath,
    `${RNFS.ExternalStorageDirectoryPath}/Music`,
    `${RNFS.ExternalStorageDirectoryPath}/Download`,
    `${RNFS.ExternalStorageDirectoryPath}/DCIM`,
    `${RNFS.ExternalStorageDirectoryPath}/Movies`,
    `${RNFS.ExternalStorageDirectoryPath}/Videos`,
    `${RNFS.ExternalStorageDirectoryPath}/WhatsApp/Media`,
  ].filter(Boolean);

  const dirStack: string[] = [...searchPaths];
  const fileTasks: { path: string; name: string; type: 'audio' | 'video' }[] =
    [];

  // Step 1: Discover all files
  while (dirStack.length > 0) {
    const dirPath = dirStack.pop();
    if (!dirPath) continue;

    try {
      const items = await RNFS.readDir(dirPath);
      for (const item of items) {
        if (seenPaths.has(item.path)) continue;
        seenPaths.add(item.path);

        if (item.isDirectory()) {
          dirStack.push(item.path);
        } else {
          const ext = extOf(item.name);
          if (
            AUDIO_EXTENSIONS.includes(ext as (typeof AUDIO_EXTENSIONS)[number])
          ) {
            fileTasks.push({ path: item.path, name: item.name, type: 'audio' });
          } else if (
            VIDEO_EXTENSIONS.includes(ext as (typeof VIDEO_EXTENSIONS)[number])
          ) {
            fileTasks.push({ path: item.path, name: item.name, type: 'video' });
          }
        }
      }
    } catch (err) {
      Logger.warn(
        'StorageScanner',
        `Failed to read directory: ${dirPath}`,
        err,
      );
    }
  }

  // Step 2: Extract metadata with concurrency control
  let completed = 0;
  const processTask = async (task: (typeof fileTasks)[0]) => {
    try {
      if (task.type === 'audio') {
        const meta = await extractAudioMetadata(task.path);
        songs.push({
          id: task.path,
          path: task.path,
          title: meta.title ?? task.name,
          artist: meta.artist ?? 'Unknown Artist',
          album: meta.album ?? 'Unknown Album',
          duration: meta.duration ?? 0,
          albumArt: meta.albumArt ?? null,
          genre: meta.genre ?? '',
          year: meta.year ?? '',
          dateAdded: meta.dateAdded ?? Date.now(),
          mood: meta.mood ?? 'Chill',
        });
      } else {
        const vm = await extractVideoMetadata(task.path, task.name);
        videos.push({
          id: task.path,
          path: task.path,
          title: vm.title,
          duration: vm.duration,
          width: vm.width,
          height: vm.height,
          sizeBytes: vm.sizeBytes,
          thumbnailUri: vm.thumbnailUri,
        });
      }
    } catch (err) {
      Logger.warn('StorageScanner', `Failed to process ${task.path}`, err);
    } finally {
      completed++;
      onProgress(completed);
    }
  };

  for (let i = 0; i < fileTasks.length; i += CONCURRENCY_LIMIT) {
    const chunk = fileTasks.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(chunk.map(processTask));
  }

  return { songs, videos };
}
