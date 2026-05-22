import { NativeModules, Platform } from 'react-native';

type NativeMainAudioFx = {
  getBandCount(): Promise<number>;
  setGlobalFxEnabled(enabled: boolean): void;
  setBandMillibels(band: number, millibel: number): void;
  resetBands(): void;
  setBassBoostEnabled(enabled: boolean, strengthPermille: number): void;
  setVirtualizerEnabled(enabled: boolean, strengthPermille: number): void;
};

const bridge = NativeModules.MainAudioFx as NativeMainAudioFx | undefined;

export const MainAudioFx: NativeMainAudioFx | null =
  Platform.OS === 'android' && bridge ? bridge : null;
