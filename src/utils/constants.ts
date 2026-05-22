export const AUDIO_EXTENSIONS = [
  '.mp3',
  '.flac',
  '.wav',
  '.aac',
  '.m4a',
  '.ogg',
  '.opus',
] as const;

export const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mkv',
  '.mov',
  '.avi',
  '.webm',
  '.3gp',
  '.ts',
  '.m2ts',
  '.m4v',
  '.wmv',
  '.flv',
  '.vob',
  '.rm',
  '.rmvb',
  '.divx',
  '.xvid',
  '.f4v',
] as const;

export const STORAGE_KEYS = {
  libraryMeta: 'av:library_meta',
  favorites: 'av:favorites',
  playlists: 'av:playlists',
  recentlyPlayed: 'av:recentlyPlayed',
  eq: 'av:eq',
  settings: 'av:settings',
  stats: 'av:stats',
  speedMemory: 'av:speedMemory',
  gestureHints: 'av:gestureHints',
  playerState: 'av:playerState',
} as const;

export const RECENTLY_PLAYED_MAX = 20;

export const GESTURE_HINT_KEYS = {
  musicNowPlaying: 'av:hint:musicNp',
  videoPlayer: 'av:hint:video',
} as const;
