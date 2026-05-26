import { create } from 'zustand';

interface VideoPlayerState {
  /** The video ID currently being played, or null if no video player is open */
  activeVideoId: string | null;
  /** Open the video player with a given video ID */
  openVideo: (videoId: string) => void;
  /** Close the video player */
  closeVideo: () => void;
}

export const useVideoPlayerStore = create<VideoPlayerState>()((set) => ({
  activeVideoId: null,
  openVideo: (videoId) => set({ activeVideoId: videoId }),
  closeVideo: () => set({ activeVideoId: null }),
}));
