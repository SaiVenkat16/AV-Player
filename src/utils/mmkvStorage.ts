import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * Single MMKV instance for the entire app.
 * All data is stored locally on the device - no backend/server involved.
 */
let mmkvInstance: ReturnType<typeof createMMKV>;

try {
  mmkvInstance = createMMKV({ id: 'av-player-storage' });
  // Test write/read to verify MMKV is working
  mmkvInstance.set('__mmkv_test__', 'ok');
  const testVal = mmkvInstance.getString('__mmkv_test__');
  if (testVal !== 'ok') {
    throw new Error('MMKV read/write test failed');
  }
  mmkvInstance.remove('__mmkv_test__');
} catch (e) {
  console.error('[MMKV] Failed to initialize, app may not persist data:', e);
  // Create a minimal fallback that won't crash
  mmkvInstance = createMMKV({ id: 'av-player-storage' });
}

export const mmkv = mmkvInstance;

/**
 * Zustand-compatible storage adapter using MMKV.
 */
export const mmkvZustandStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      const value = mmkv.getString(name);
      return value !== undefined ? value : null;
    } catch (e) {
      console.warn('[MMKV] getItem error:', name, e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      mmkv.set(name, value);
    } catch (e) {
      console.warn('[MMKV] setItem error:', name, e);
    }
  },
  removeItem: (name: string): void => {
    try {
      mmkv.remove(name);
    } catch (e) {
      console.warn('[MMKV] removeItem error:', name, e);
    }
  },
};
