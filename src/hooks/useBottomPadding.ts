import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/playerStore';

export function useBottomPadding(hideMiniPlayer = false) {
  const insets = useSafeAreaInsets();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlayerVisible = usePlayerStore((s) => s.isPlayerVisible);

  return useMemo(() => {
    // Since bottom TabBar is hidden, we only need bottom safe area inset
    const baseBottomOffset = insets.bottom;
    
    // MiniPlayer is visible if there is a current song, the full player is not open,
    // and this screen doesn't explicitly hide it.
    const showMiniPlayer = currentSong && !isPlayerVisible && !hideMiniPlayer;
    const miniPlayerHeight = showMiniPlayer ? 72 + 8 : 0; // 72 height + 8 margin/gap
    
    // 12px extra breathing room at the bottom
    return baseBottomOffset + miniPlayerHeight + 12;
  }, [insets.bottom, currentSong, isPlayerVisible, hideMiniPlayer]);
}
