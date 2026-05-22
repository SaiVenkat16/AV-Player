import { NativeModules, Platform } from 'react-native';
import CreateThumbnail from 'react-native-create-thumbnail';
import { toLocalPath, toMediaUri } from '../utils/mediaUri';
import { Logger } from '../utils/logger';

type NativeVideoMetadataRetriever = {
  getMetadata: (
    path: string,
    options?: { previewTimesMs?: number[] },
  ) => Promise<{
    duration?: number;
    width?: number;
    height?: number;
    rotation?: number;
    thumbnailUri?: string | null;
  }>;
};

type CreateThumbnailResult = {
  path: string;
  width: number;
  height: number;
  duration?: number;
};

export type VideoMetadata = {
  duration: number;
  width: number;
  height: number;
  rotation: number;
  thumbnailUri: string | null;
};

const DEFAULT_PREVIEW_TIMES_MS = [750, 1500, 3000, 0];
const THUMBNAIL_CACHE_VERSION = 'v2';

const { VideoMetadataRetriever } = NativeModules as {
  VideoMetadataRetriever?: NativeVideoMetadataRetriever;
};

function hashVideoPath(path: string): number {
  let hash = 0;
  for (let i = 0; i < path.length; i += 1) {
    hash = (hash * 31 + path.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

function sanitizeMetadata(
  meta: Partial<VideoMetadata> | null | undefined,
): VideoMetadata {
  return {
    duration:
      meta?.duration && Number.isFinite(meta.duration)
        ? Math.max(0, Math.floor(meta.duration))
        : 0,
    width:
      meta?.width && Number.isFinite(meta.width)
        ? Math.max(0, Math.floor(meta.width))
        : 0,
    height:
      meta?.height && Number.isFinite(meta.height)
        ? Math.max(0, Math.floor(meta.height))
        : 0,
    rotation:
      meta?.rotation && Number.isFinite(meta.rotation)
        ? Math.floor(meta.rotation)
        : 0,
    thumbnailUri: meta?.thumbnailUri ? toMediaUri(meta.thumbnailUri) ?? null : null,
  };
}

async function createThumbnailFallback(path: string): Promise<VideoMetadata> {
  const attempts = DEFAULT_PREVIEW_TIMES_MS.flatMap((timeStamp) => [
    { url: toLocalPath(path), timeStamp },
    { url: toMediaUri(path) ?? path, timeStamp },
  ]);

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      const thumb = (await CreateThumbnail.createThumbnail({
        url: attempt.url,
        timeStamp: attempt.timeStamp,
        format: 'jpeg',
        maxWidth: 320,
        maxHeight: 320,
        onlySyncedFrames: false,
        cacheName: `video-thumb-${Math.abs(hashVideoPath(path))}-${attempt.timeStamp}-${THUMBNAIL_CACHE_VERSION}`,
      })) as CreateThumbnailResult;

      return sanitizeMetadata({
        thumbnailUri: thumb.path,
        width: thumb.width,
        height: thumb.height,
        duration:
          typeof thumb.duration === 'number' ? Math.floor(thumb.duration) : 0,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error(`Unable to create thumbnail for ${path}`);
}

export async function getVideoMetadata(path: string): Promise<VideoMetadata> {
  if (Platform.OS === 'android' && VideoMetadataRetriever?.getMetadata) {
    try {
      const meta = await VideoMetadataRetriever.getMetadata(path, {
        previewTimesMs: DEFAULT_PREVIEW_TIMES_MS,
      });
      return sanitizeMetadata(meta);
    } catch (error) {
      Logger.warn(
        'VideoMetadataService',
        `Native video retriever failed for ${path}, falling back`,
        error,
      );
    }
  }

  return createThumbnailFallback(path);
}

export async function createVideoThumbnail(path: string): Promise<{
  thumbnailUri: string;
  width: number;
  height: number;
  duration: number;
}> {
  const meta = await getVideoMetadata(path);
  if (!meta.thumbnailUri) {
    throw new Error(`Thumbnail not available for ${path}`);
  }
  return {
    thumbnailUri: meta.thumbnailUri,
    width: meta.width,
    height: meta.height,
    duration: meta.duration,
  };
}
