import React, { useCallback } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { runOnJS } from 'react-native-reanimated';
import { useProgress } from 'react-native-track-player';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { usePlayerStore } from '../../store/playerStore';
import { formatTime } from '../../utils/formatTime';
import { toImageSource } from '../../utils/mediaUri';

export function MiniPlayer({ bottomInset }: { bottomInset: number }): React.ReactElement | null {
  const navigation = useNavigation();
  const current = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPlayerVisible = usePlayerStore((s) => s.isPlayerVisible);
  const { position, duration } = useProgress(500);
  const toggle = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.nextSong);
  const prev = usePlayerStore((s) => s.prevSong);
  const expand = usePlayerStore((s) => s.setPlayerVisible);

  const openNowPlaying = useCallback(() => {
    expand(true, false);
    (navigation as unknown as { navigate: (a: string, b?: { screen: string }) => void }).navigate(
      'Music',
      {
        screen: 'NowPlaying',
      },
    );
  }, [expand, navigation]);

  const fireNext = useCallback(() => {
    next();
  }, [next]);

  const firePrev = useCallback(() => {
    prev();
  }, [prev]);

  // Get deepest active screen name to hide on video player / folder screens
  const activeScreen = useNavigationState((state) => {
    if (!state) return '';
    let route = state.routes[state.index ?? 0];
    while (route?.state) {
      const s = route.state as any;
      route = s.routes[s.index ?? 0];
    }
    return route?.name ?? '';
  });

  const VIDEO_SCREENS = ['VideoPlayer', 'VideoFolderDetail'];

  if (!current || isPlayerVisible || VIDEO_SCREENS.includes(activeScreen)) {
    return null;
  }
  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(openNowPlaying)();
  });

  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -80) {
        runOnJS(fireNext)();
      } else if (e.translationX > 80) {
        runOnJS(firePrev)();
      }
    });

  const composed = Gesture.Exclusive(pan, tap);
  const prog = duration > 0 ? Math.min(1, position / duration) : 0;
  return (
    <GestureDetector gesture={composed}>
      <View style={[styles.wrap, { bottom: bottomInset }]}>
        <LinearGradient
          colors={['rgba(22,22,42,0.92)', 'rgba(15,15,26,0.96)']}
          style={styles.card}>
          {current.albumArt ? (
            <Image source={toImageSource(current.albumArt)} style={styles.art} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[...Colors.gradient1]} style={styles.art} />
          )}
          <View style={styles.meta}>
            <Text numberOfLines={1} style={[Typography.subtitle, styles.t]}>
              {current.title}
            </Text>
            <Text numberOfLines={1} style={[Typography.body, styles.a]}>
              {current.artist}
            </Text>
          </View>
          <View style={styles.ctrl}>
            <MaterialCommunityIcons
              name="skip-previous"
              size={22}
              color={Colors.textPrimary}
              onPress={() => prev()}
            />
            <MaterialCommunityIcons
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={34}
              color={Colors.accent1}
              onPress={() => toggle()}
            />
            <MaterialCommunityIcons
              name="skip-next"
              size={22}
              color={Colors.textPrimary}
              onPress={() => next()}
            />
          </View>
          <View style={[styles.prog, { width: `${prog * 100}%` }]} />
          <Text style={styles.times} numberOfLines={1}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </LinearGradient>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 72,
    zIndex: 60,
    elevation: 24,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  art: { width: 44, height: 44, borderRadius: 10 },
  meta: { flex: 1, marginLeft: 10 },
  t: { color: Colors.textPrimary },
  a: { color: Colors.textSecondary },
  ctrl: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  prog: {
    position: 'absolute',
    left: 0,
    bottom: 18,
    height: 3,
    backgroundColor: Colors.accent2,
  },
  times: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 2,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
