import { create } from 'zustand';

interface VideoPlayerState {
  /** The video ID currently being played, or null if no video player is open */
  activeVideoId: string | null;
  /**
   * Optional ordered list of video IDs from which `activeVideoId` was opened.
   * When the current video ends we advance through this list so the next
   * video starts automatically (mirrors MX Player / VLC behaviour).
   */
  playlist: string[];
  /** Open the video player with a given video ID. Optionally provide the
   *  surrounding folder/list so we can auto-advance on end. */
  openVideo: (videoId: string, playlist?: string[]) => void;
  /** Switch playback to the next video in the playlist (no-op at end). */
  playNext: () => boolean;
  /** Switch playback to the previous video in the playlist (no-op at start). */
  playPrevious: () => boolean;
  /** Close the video player */
  closeVideo: () => void;
}

export const useVideoPlayerStore = create<VideoPlayerState>()((set, get) => ({
  activeVideoId: null,
  playlist: [],
  openVideo: (videoId, playlist) =>
    set({
      activeVideoId: videoId,
      playlist: playlist && playlist.length > 0 ? playlist : [videoId],
    }),
  playNext: () => {
    const { playlist, activeVideoId } = get();
    const idx = activeVideoId ? playlist.indexOf(activeVideoId) : -1;
    if (idx < 0 || idx >= playlist.length - 1) return false;
    set({ activeVideoId: playlist[idx + 1] });
    return true;
  },
  playPrevious: () => {
    const { playlist, activeVideoId } = get();
    const idx = activeVideoId ? playlist.indexOf(activeVideoId) : -1;
    if (idx <= 0) return false;
    set({ activeVideoId: playlist[idx - 1] });
    return true;
  },
  closeVideo: () => set({ activeVideoId: null, playlist: [] }),
}));
