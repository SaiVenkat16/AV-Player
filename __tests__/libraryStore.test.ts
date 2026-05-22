jest.mock('../src/services/StorageScanner', () => ({
  createVideoThumbnail: jest.fn(),
  requestStoragePermission: jest.fn().mockResolvedValue(true),
  scanDeviceMedia: jest.fn().mockResolvedValue({ songs: [], videos: [] }),
}));

import { act } from 'react-test-renderer';
import RNFS from 'react-native-fs';
import { createVideoThumbnail } from '../src/services/StorageScanner';
import {
  LIBRARY_VIDEO_CACHE_VERSION,
  migrateLibraryPersistedState,
  useLibraryStore,
} from '../src/store/libraryStore';
import type { Video } from '../src/types';

const mockedCreateVideoThumbnail = createVideoThumbnail as jest.MockedFunction<
  typeof createVideoThumbnail
>;
const mockedExists = RNFS.exists as jest.MockedFunction<typeof RNFS.exists>;

const sampleVideo: Video = {
  id: 'video-1',
  path: '/storage/emulated/0/DCIM/video-1.mp4',
  title: 'Video 1',
  duration: 12,
  width: 1920,
  height: 1080,
  sizeBytes: 1024,
  thumbnailUri: 'file:///cache/thumb.jpg',
};

describe('libraryStore video thumbnail repair', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLibraryStore.setState({
      songs: [],
      videos: [],
      playlists: [],
      favorites: [],
      recentlyPlayed: [],
      isScanning: false,
      scanProgress: 0,
      isLoaded: false,
      videoCacheVersion: LIBRARY_VIDEO_CACHE_VERSION,
    });
  });

  test('stale cache versions clear persisted thumbnails', () => {
    const migrated = migrateLibraryPersistedState(
      {
        songs: [],
        videos: [sampleVideo],
        playlists: [],
        favorites: [],
        recentlyPlayed: [],
        isLoaded: true,
        videoCacheVersion: LIBRARY_VIDEO_CACHE_VERSION - 1,
      },
      0,
    );

    expect(migrated.videoCacheVersion).toBe(LIBRARY_VIDEO_CACHE_VERSION);
    expect(migrated.videos[0]?.thumbnailUri).toBeNull();
  });

  test('missing thumbnail files trigger regeneration', async () => {
    mockedExists.mockResolvedValue(false);
    mockedCreateVideoThumbnail.mockResolvedValue({
      thumbnailUri: 'file:///cache/thumb-rebuilt.jpg',
      width: 1080,
      height: 1920,
      duration: 33,
    });

    useLibraryStore.setState({ videos: [sampleVideo] });

    await act(async () => {
      await useLibraryStore.getState().ensureVideoThumbnail(sampleVideo.id);
    });

    expect(mockedCreateVideoThumbnail).toHaveBeenCalledTimes(1);
    expect(useLibraryStore.getState().videos[0]?.thumbnailUri).toBe(
      'file:///cache/thumb-rebuilt.jpg',
    );
  });

  test('duplicate thumbnail repairs share one in-flight job', async () => {
    let resolveThumbnail:
      | ((value: {
          thumbnailUri: string;
          width: number;
          height: number;
          duration: number;
        }) => void)
      | undefined;

    mockedCreateVideoThumbnail.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveThumbnail = resolve;
        }),
    );

    useLibraryStore.setState({
      videos: [{ ...sampleVideo, thumbnailUri: null }],
    });

    const repair1 = useLibraryStore
      .getState()
      .ensureVideoThumbnail(sampleVideo.id, { force: true });
    const repair2 = useLibraryStore
      .getState()
      .ensureVideoThumbnail(sampleVideo.id, { force: true });

    expect(mockedCreateVideoThumbnail).toHaveBeenCalledTimes(1);

    resolveThumbnail?.({
      thumbnailUri: 'file:///cache/thumb-shared.jpg',
      width: 720,
      height: 1280,
      duration: 20,
    });

    await act(async () => {
      await Promise.all([repair1, repair2]);
    });

    expect(useLibraryStore.getState().videos[0]?.thumbnailUri).toBe(
      'file:///cache/thumb-shared.jpg',
    );
  });
});
