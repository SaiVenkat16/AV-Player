import { NativeModules, Platform } from 'react-native';

type NativeVideoPlayerModule = {
  open: (path: string) => Promise<void>;
};

const NativeVideoPlayer = NativeModules.NativeVideoPlayer as
  | NativeVideoPlayerModule
  | undefined;

export function isNativeVideoPlayerAvailable(): boolean {
  return Platform.OS === 'android' && typeof NativeVideoPlayer?.open === 'function';
}

export async function openNativeVideoPlayer(path: string): Promise<void> {
  if (!isNativeVideoPlayerAvailable()) {
    throw new Error('NativeVideoPlayer is not available');
  }
  await NativeVideoPlayer!.open(path);
}
