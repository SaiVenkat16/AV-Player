import AsyncStorage from '@react-native-async-storage/async-storage';
import { mmkv } from './mmkvStorage';
import { Logger } from './logger';

const MIGRATION_FLAG = 'av:mmkv_migrated';

/**
 * One-time migration from AsyncStorage to MMKV.
 * Copies all existing keys to MMKV, then marks migration as done.
 * Safe to call multiple times - skips if already migrated.
 */
export async function migrateAsyncStorageToMMKV(): Promise<void> {
  // Already migrated?
  if (mmkv.getBoolean(MIGRATION_FLAG) === true) {
    return;
  }

  try {
    const keys = await AsyncStorage.getAllKeys();
    if (keys.length === 0) {
      // Nothing to migrate - fresh install
      mmkv.set(MIGRATION_FLAG, true);
      return;
    }

    const pairs = await AsyncStorage.multiGet(keys);
    let migrated = 0;

    for (const [key, value] of pairs) {
      if (key && value != null) {
        mmkv.set(key, value);
        migrated++;
      }
    }

    mmkv.set(MIGRATION_FLAG, true);
    Logger.info('StorageMigration', `Migrated ${migrated} keys from AsyncStorage to MMKV`);

    // Clear AsyncStorage after successful migration to free space
    await AsyncStorage.clear();
    Logger.info('StorageMigration', 'AsyncStorage cleared after migration');
  } catch (error) {
    Logger.error('StorageMigration', 'Migration failed - will retry next launch', error);
    // Don't set flag - will retry on next app launch
  }
}
