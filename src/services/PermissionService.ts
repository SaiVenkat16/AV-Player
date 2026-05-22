import { PermissionsAndroid, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Logger } from '../utils/logger';

async function ensureAndroidPermissions(
  permissions: readonly string[],
  label: string,
): Promise<boolean> {
  try {
    for (const permission of permissions) {
      const status = await check(permission as never);
      if (status === RESULTS.GRANTED) {
        continue;
      }
      const next = await request(permission as never);
      if (next !== RESULTS.GRANTED) {
        Logger.warn('PermissionService', `${label} denied for ${permission}`);
        return false;
      }
    }
    return true;
  } catch (error) {
    Logger.warn('PermissionService', `Failed to request ${label}`, error);
    return false;
  }
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const sdk = Platform.Version as number;
  if (sdk >= 33) {
    return ensureAndroidPermissions(
      [
        PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
        PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
      ],
      'media library permissions',
    );
  }

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  ]);
  return Object.values(result).every(
    (value) => value === PermissionsAndroid.RESULTS.GRANTED,
  );
}

export async function requestBluetoothPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const sdk = Platform.Version as number;
  if (sdk < 31) {
    return true;
  }

  return ensureAndroidPermissions(
    [
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
    ],
    'bluetooth permissions',
  );
}

export async function ensurePlaybackNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const sdk = Platform.Version as number;
  if (sdk < 33) {
    return true;
  }

  return ensureAndroidPermissions(
    [ANDROID_POST_NOTIFICATIONS],
    'notification permission',
  );
}
const ANDROID_POST_NOTIFICATIONS = 'android.permission.POST_NOTIFICATIONS';
