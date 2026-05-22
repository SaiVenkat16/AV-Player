import 'react-native-gesture-handler/jestSetup.js';

jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));

jest.mock('@react-native-masked-view/masked-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...rest }) => React.createElement(View, rest, children),
  };
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('react-native-system-setting', () => ({
  __esModule: true,
  default: {
    getVolume: jest.fn().mockResolvedValue(0.5),
    setVolume: jest.fn(),
  },
}));

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    ExternalStorageDirectoryPath: '/sdcard',
    CachesDirectoryPath: '/cache',
    readDir: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(true),
    stat: jest.fn().mockResolvedValue({ size: 0 }),
    read: jest.fn().mockResolvedValue(''),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('react-native-create-thumbnail', () => ({
  __esModule: true,
  default: {
    createThumbnail: jest.fn().mockResolvedValue({ path: '', width: 0, height: 0, size: 0, mime: '' }),
  },
}));

jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => React.createElement(View, { ...props, ref })),
    ViewType: {
      TEXTURE: 0,
      SURFACE: 1,
      SURFACE_SECURE: 2,
    },
  };
});

jest.mock('react-native-orientation-locker', () => ({
  lockToPortrait: jest.fn(),
  lockToLandscape: jest.fn(),
  unlockAllOrientations: jest.fn(),
}));

jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return { FlashList: FlatList };
});

jest.mock('@react-native-community/blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('react-native-permissions', () => ({
  check: jest.fn().mockResolvedValue('granted'),
  request: jest.fn().mockResolvedValue('granted'),
  PERMISSIONS: { ANDROID: {} },
  RESULTS: { GRANTED: 'granted' },
}));

jest.mock('react-native-drag-sort', () => {
  const React = require('react');
  const { View } = require('react-native');
  const AutoDragSortableView = ({ dataSource, renderItem }) =>
    React.createElement(
      View,
      null,
      (dataSource ?? []).map((item, index) => renderItem(item, index)),
    );
  return { AutoDragSortableView };
});

jest.mock('react-native-bluetooth-classic', () => ({
  __esModule: true,
  default: {
    getBondedDevices: jest.fn().mockResolvedValue([]),
    getConnectedDevices: jest.fn().mockResolvedValue([]),
    connectToDevice: jest.fn().mockResolvedValue(undefined),
    disconnectFromDevice: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('lottie-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View),
  };
});

jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    registerPlaybackService: jest.fn(),
    setupPlayer: jest.fn(),
    updateOptions: jest.fn(),
    reset: jest.fn(),
    add: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seekTo: jest.fn(),
    skipToNext: jest.fn(),
    skipToPrevious: jest.fn(),
    getQueue: jest.fn().mockResolvedValue([]),
    getPlaybackState: jest.fn().mockResolvedValue({ state: 'stopped' }),
    getVolume: jest.fn().mockResolvedValue(1),
    setVolume: jest.fn(),
    getPosition: jest.fn().mockResolvedValue(0),
    getDuration: jest.fn().mockResolvedValue(0),
    getActiveTrack: jest.fn().mockResolvedValue(null),
    remove: jest.fn(),
    move: jest.fn(),
    setRepeatMode: jest.fn(),
  },
  Event: {},
  State: { Playing: 'playing', Paused: 'paused', None: 'none' },
  Capability: {},
  RepeatMode: {},
  AppKilledPlaybackBehavior: {},
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
