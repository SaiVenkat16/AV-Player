import React from 'react';
import { Platform } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import Video, { ViewType } from 'react-native-video';
import { useLibraryStore } from '../src/store/libraryStore';

Object.defineProperty(Platform, 'OS', {
  configurable: true,
  value: 'android',
});

jest.mock('../src/services/NativeVideoPlayer', () => ({
  isNativeVideoPlayerAvailable: jest.fn(() => true),
  openNativeVideoPlayer: jest.fn(() => Promise.resolve()),
}));

const {
  VideoPlayerOverlay: VideoPlayerScreen,
} = require('../src/screens/video/VideoPlayerScreen') as typeof import('../src/screens/video/VideoPlayerScreen');

const { openNativeVideoPlayer } = require('../src/services/NativeVideoPlayer') as {
  openNativeVideoPlayer: jest.Mock;
};

let renderedTree: ReactTestRenderer.ReactTestRenderer | null = null;

const mockNavigation = {
  goBack: jest.fn(),
  addListener: jest.fn(() => {
    return jest.fn();
  }),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: { videoId: 'video-player-1' } }),
  useFocusEffect: jest.fn(),
}));

jest.mock('react-native-video', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  const seek = jest.fn();
  const enterPictureInPicture = jest.fn();

  const MockVideo = ReactLib.forwardRef(
    (
      props: Record<string, unknown>,
      ref: React.ForwardedRef<{
        seek: typeof seek;
        enterPictureInPicture: typeof enterPictureInPicture;
      }>,
    ) => {
      ReactLib.useImperativeHandle(ref, () => ({
        seek,
        enterPictureInPicture,
      }));
      return ReactLib.createElement(View, { ...props, testID: 'mock-video' });
    },
  );

  return {
    __esModule: true,
    default: MockVideo,
    ViewType: {
      TEXTURE: 0,
      SURFACE: 1,
      SURFACE_SECURE: 2,
    },
  };
});

describe('VideoPlayerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.addListener.mockImplementation(() => {
      return jest.fn();
    });
    act(() => {
      useLibraryStore.setState({
        songs: [],
        videos: [
          {
            id: 'video-player-1',
            path: '/storage/emulated/0/DCIM/player.mp4',
            title: 'Player Video',
            duration: 48,
            width: 1920,
            height: 1080,
            sizeBytes: 4096,
            thumbnailUri: 'file:///cache/player-thumb.jpg',
          },
        ],
        playlists: [],
        favorites: [],
        recentlyPlayed: [],
        isScanning: false,
        scanProgress: 0,
        isLoaded: true,
        videoCacheVersion: 2,
      });
    });
  });

  afterEach(() => {
    if (renderedTree) {
      act(() => {
        renderedTree?.unmount();
      });
      renderedTree = null;
    }
  });

  test('opens native Android player instead of react-native-video', async () => {
    await act(async () => {
      renderedTree = ReactTestRenderer.create(<VideoPlayerScreen />);
      await Promise.resolve();
    });

    expect(openNativeVideoPlayer).toHaveBeenCalledWith(
      'file:///storage/emulated/0/DCIM/player.mp4',
    );
    expect(() => renderedTree!.root.findByType(Video)).toThrow();
  });

  test('uses embedded player with texture view when native module unavailable', async () => {
    const { isNativeVideoPlayerAvailable } = require('../src/services/NativeVideoPlayer') as {
      isNativeVideoPlayerAvailable: jest.Mock;
    };
    isNativeVideoPlayerAvailable.mockReturnValue(false);

    await act(async () => {
      renderedTree = ReactTestRenderer.create(<VideoPlayerScreen />);
    });

    const video = renderedTree!.root.findByType(Video);
    expect(video.props.viewType).toBe(ViewType.TEXTURE);
    expect(video.props.hideShutterView).toBe(true);
  });
});
