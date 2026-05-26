import React, { useCallback, useEffect, useMemo } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { useVideoPlayerStore } from '../../store/videoPlayerStore';
import { EmbeddedVideoPlayer } from '../../components/video/EmbeddedVideoPlayer';

/**
 * VideoPlayerOverlay renders as a full-screen overlay outside of react-native-screens
 * to avoid the "addViewAt: failed to insert view" crash caused by SurfaceView
 * conflicts with native stack screen transitions.
 */
export function VideoPlayerOverlay(): React.ReactElement | null {
  const activeVideoId = useVideoPlayerStore((s) => s.activeVideoId);
  const videos = useLibraryStore((s) => s.videos);

  const item = useMemo(
    () => (activeVideoId ? videos.find((v) => v.id === activeVideoId) : undefined),
    [activeVideoId, videos],
  );

  useEffect(() => {
    if (activeVideoId) {
      usePlayerStore.getState().pause();
    }
  }, [activeVideoId]);

  const goBack = useCallback(() => {
    Orientation.lockToPortrait();
    useVideoPlayerStore.getState().closeVideo();
  }, []);

  // Handle Android hardware back button
  useEffect(() => {
    if (!activeVideoId) return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true; // Prevent default back behavior
    });

    return () => handler.remove();
  }, [activeVideoId, goBack]);

  if (!activeVideoId) {
    return null;
  }

  if (!item) {
    return (
      <View style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.errText}>Video not found</Text>
          <Pressable onPress={goBack} hitSlop={12}>
            <Text style={styles.backLink}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <EmbeddedVideoPlayer item={item} onBack={goBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  backLink: {
    color: '#7C4DFF',
    fontSize: 14,
  },
});
