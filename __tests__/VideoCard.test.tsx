import React from 'react';
import { Image } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { VideoCard } from '../src/components/library/VideoCard';
import { LIBRARY_VIDEO_CACHE_VERSION, useLibraryStore } from '../src/store/libraryStore';
import type { Video } from '../src/types';

const sampleVideo: Video = {
  id: 'video-card-1',
  path: '/storage/emulated/0/DCIM/video-card-1.mp4',
  title: 'Video Card',
  duration: 18,
  width: 1280,
  height: 720,
  sizeBytes: 2048,
  thumbnailUri: 'file:///cache/broken-thumb.jpg',
};

describe('VideoCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLibraryStore.setState({
      songs: [],
      videos: [sampleVideo],
      playlists: [],
      favorites: [],
      recentlyPlayed: [],
      isScanning: false,
      scanProgress: 0,
      isLoaded: true,
      videoCacheVersion: LIBRARY_VIDEO_CACHE_VERSION,
      ensureVideoThumbnail: jest.fn().mockResolvedValue(undefined) as never,
      invalidateVideoThumbnail: jest.fn() as never,
    });
  });

  test('broken thumbnails trigger one repair attempt', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = ReactTestRenderer.create(
        <VideoCard
          item={sampleVideo}
          onOpen={jest.fn()}
          onLongMenu={jest.fn()}
        />,
      );
    });

    const ensureVideoThumbnail = useLibraryStore.getState().ensureVideoThumbnail as jest.Mock;
    const invalidateVideoThumbnail = useLibraryStore.getState()
      .invalidateVideoThumbnail as jest.Mock;

    const thumb = tree!.root.findByType(Image);

    await act(async () => {
      thumb.props.onError();
    });

    expect(invalidateVideoThumbnail).toHaveBeenCalledWith(sampleVideo.id);
    expect(ensureVideoThumbnail).toHaveBeenCalledWith(sampleVideo.id, {
      force: true,
    });
  });
});
