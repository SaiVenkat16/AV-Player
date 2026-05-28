import { NativeModules, Platform } from 'react-native';
import { Logger } from '../utils/logger';

interface FileManagerNative {
  deleteMedia: (path: string, isVideo: boolean) => Promise<boolean>;
  shareMedia: (path: string, isVideo: boolean, title: string) => Promise<boolean>;
  getMediaContentUri: (path: string, isVideo: boolean) => Promise<string | null>;
  shareMediaBulk: (paths: string[], isVideo: boolean) => Promise<boolean>;
  deleteMediaBulk: (paths: string[], isVideo: boolean) => Promise<number>;
  setImmersive: (immersive: boolean) => Promise<boolean>;
}

const { FileManager } = NativeModules as { FileManager?: FileManagerNative };

export async function deleteMediaFile(
  path: string,
  isVideo: boolean,
): Promise<boolean> {
  if (Platform.OS !== 'android' || !FileManager?.deleteMedia) {
    Logger.warn('FileOpsService', 'FileManager native module unavailable');
    return false;
  }
  try {
    return await FileManager.deleteMedia(path, isVideo);
  } catch (err) {
    Logger.warn('FileOpsService', `deleteMedia failed for ${path}`, err);
    return false;
  }
}

export async function shareMediaFile(
  path: string,
  title: string,
  isVideo: boolean,
): Promise<boolean> {
  if (Platform.OS !== 'android' || !FileManager?.shareMedia) {
    Logger.warn('FileOpsService', 'FileManager native module unavailable');
    return false;
  }
  try {
    return await FileManager.shareMedia(path, isVideo, title);
  } catch (err) {
    Logger.warn('FileOpsService', `share failed for ${path}`, err);
    return false;
  }
}

export async function shareMediaFilesBulk(
  paths: string[],
  isVideo: boolean,
): Promise<boolean> {
  if (Platform.OS !== 'android' || !FileManager?.shareMediaBulk) {
    Logger.warn('FileOpsService', 'FileManager native module unavailable');
    return false;
  }
  if (paths.length === 0) return false;
  try {
    return await FileManager.shareMediaBulk(paths, isVideo);
  } catch (err) {
    Logger.warn('FileOpsService', 'shareMediaBulk failed', err);
    return false;
  }
}

/**
 * @returns number of files actually deleted (0 if user cancelled).
 */
export async function deleteMediaFilesBulk(
  paths: string[],
  isVideo: boolean,
): Promise<number> {
  if (Platform.OS !== 'android' || !FileManager?.deleteMediaBulk) {
    Logger.warn('FileOpsService', 'FileManager native module unavailable');
    return 0;
  }
  if (paths.length === 0) return 0;
  try {
    return await FileManager.deleteMediaBulk(paths, isVideo);
  } catch (err) {
    Logger.warn('FileOpsService', 'deleteMediaBulk failed', err);
    return 0;
  }
}


/**
 * Toggle Android immersive (edge-to-edge) mode. When enabled, the system
 * status bar and navigation bar are hidden so video can fill the entire
 * screen. Should be re-disabled when leaving the player.
 */
export async function setImmersiveMode(immersive: boolean): Promise<boolean> {
  if (Platform.OS !== 'android' || !FileManager?.setImmersive) {
    return false;
  }
  try {
    return await FileManager.setImmersive(immersive);
  } catch (err) {
    Logger.warn('FileOpsService', `setImmersive(${immersive}) failed`, err);
    return false;
  }
}
