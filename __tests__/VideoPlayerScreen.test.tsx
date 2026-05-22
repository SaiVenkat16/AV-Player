import React from 'react';
import { Platform } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import Orientation from 'react-native-orientation-locker';
import Video, { ViewType } from 'react-native-video';
import { useLibraryStore } from '../src/store/libraryStore';

Object.defineProperty(Platform, 'OS', {
  configurable: true,
  value: 'android',
});

const {
  VideoPlayerScreen,
} = require('../src/screens/video/VideoPlayerScreen') as typeof import('../src/screens/video/VideoPlayerScreen');

let beforeRemoveHandler: (() => void) | undefined;
let renderedTree: ReactTestRenderer.ReactTestRenderer | null = null;

const mockNavigation = {
  goBack: jest.fn(),
  addListener: jest.fn((_event: string, cb: () => void) => {
    beforeRemoveHandler = cb;
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

jest.mock('../src/components/video/VideoGestureHandler', () => ({
  VideoGestureHandler: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/components/video/VideoControls', () => ({
  VideoControls: () => null,
}));

jest.mock('../src/components/video/GestureHUD', () => ({
  GestureHUD: () => null,
}));

describe('VideoPlayerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    beforeRemoveHandler = undefined;
    mockNavigation.addListener.mockImplementation((_event: string, cb: () => void) => {
      beforeRemoveHandler = cb;
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

  test('starts on Android texture view first', () => {
    act(() => {
      renderedTree = ReactTestRenderer.create(<VideoPlayerScreen />);
    });

    const video = renderedTree!.root.findByType(Video);
    expect(video.props.viewType).toBe(ViewType.TEXTURE);
  });

  test('falls back to surface view when progress advances without a ready frame', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000);

    act(() => {
      renderedTree = ReactTestRenderer.create(<VideoPlayerScreen />);
    });

    const firstVideo = renderedTree!.root.findByType(Video);

    act(() => {
      firstVideo.props.onLoadStart();
    });

    nowSpy.mockReturnValue(3_500);

    act(() => {
      firstVideo.props.onProgress({ currentTime: 0.75 });
    });

    const retriedVideo = renderedTree!.root.findByType(Video);
    expect(retriedVideo.props.viewType).toBe(ViewType.SURFACE);

    nowSpy.mockRestore();
  });

  test('restores portrait on navigation removal and unmount', () => {
    const orientation = Orientation as jest.Mocked<typeof Orientation>;

    act(() => {
      renderedTree = ReactTestRenderer.create(<VideoPlayerScreen />);
    });

    const beforeRemovePortraitCalls = orientation.lockToPortrait.mock.calls.length;

    act(() => {
      beforeRemoveHandler?.();
    });

    expect(orientation.lockToPortrait.mock.calls.length).toBeGreaterThan(
      beforeRemovePortraitCalls,
    );

    const beforeUnmountPortraitCalls = orientation.lockToPortrait.mock.calls.length;

    act(() => {
      renderedTree?.unmount();
    });
    renderedTree = null;

    expect(orientation.lockToPortrait.mock.calls.length).toBeGreaterThan(
      beforeUnmountPortraitCalls,
    );
  });
});
