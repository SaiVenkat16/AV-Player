import React, { useCallback } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { runOnJS } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { usePlayerStore } from '../../store/playerStore';
import { useVideoPlayerStore } from '../../store/videoPlayerStore';
import { useLibraryStore } from '../../store/libraryStore';
import { toImageSource } from '../../utils/mediaUri';
import { styles } from '../../styles/components/player/MiniPlayerStyles';

export function MiniPlayer({ bottomInset }: { bottomInset: number }): React.ReactElement | null {
  const navigation = useNavigation();
  const current = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPlayerVisible = usePlayerStore((s) => s.isPlayerVisible);
  const toggle = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.nextSong);
  const expand = usePlayerStore((s) => s.setPlayerVisible);

  const openNowPlaying = useCallback(() => {
    expand(true, false);
    (navigation as any).navigate('Music', { screen: 'NowPlaying' });
  }, [expand, navigation]);

  const fireNext = useCallback(() => { next(); }, [next]);

  const activeScreen = useNavigationState((state) => {
    if (!state) return '';
    let route = state.routes[state.index ?? 0];
    while (route?.state) {
      const s = route.state as any;
      route = s.routes[s.index ?? 0];
    }
    return route?.name ?? '';
  });

  const activeVideoId = useVideoPlayerStore((s) => s.activeVideoId);
  const privateIds = useLibraryStore((s) => s.privateIds);

  const isPrivateSong = current ? privateIds.includes(current.id) : false;

  if (!current || isPlayerVisible || isPrivateSong || activeScreen === 'VideoFolderDetail' || activeScreen === 'NowPlaying' || activeVideoId) {
    return null;
  }

  const tap = Gesture.Tap().onEnd(() => { runOnJS(openNowPlaying)(); });
  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -80) { runOnJS(fireNext)(); }
    });
  const composed = Gesture.Exclusive(pan, tap);

  return (
    <View style={[styles.wrap, { bottom: bottomInset }]}>
      <View style={styles.card}>
        <GestureDetector gesture={composed}>
          <View style={styles.gestureView}>
            {current.albumArt ? (
              <Image source={toImageSource(current.albumArt)} style={styles.art} resizeMode="cover" />
            ) : (
              <View style={[styles.art, styles.artPlaceholder]}>
                <MaterialCommunityIcons name="album" size={22} color={Colors.textMuted} />
              </View>
            )}
            <View style={styles.meta}>
              <Text numberOfLines={1} style={styles.title}>{current.title}</Text>
              <Text numberOfLines={1} style={styles.artist}>{current.artist}</Text>
            </View>
          </View>
        </GestureDetector>

        <Pressable onPress={() => toggle()} hitSlop={12} style={styles.playBtn}>
          <MaterialCommunityIcons
            name={isPlaying ? 'pause' : 'play'}
            size={26}
            color={Colors.textPrimary}
          />
        </Pressable>

        <Pressable onPress={() => next()} hitSlop={12}>
          <MaterialCommunityIcons name="skip-next" size={22} color={Colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
