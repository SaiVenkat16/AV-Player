import React, { useCallback, useEffect, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useProgress } from 'react-native-track-player';
import { useShallow } from 'zustand/react/shallow';
import { ProgressBar } from '../../components/player/ProgressBar';
import { EqualizerSheet } from '../../components/equalizer/EqualizerSheet';
import { QueueSheet } from '../../components/player/QueueSheet';
import { SleepTimerSheet } from '../../components/player/SleepTimerSheet';
import { Colors } from '../../theme/colors';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import { usePlayerStore } from '../../store/playerStore';
import { useLibraryStore } from '../../store/libraryStore';
import { dominantAuraColorFromSeed, softenHex } from '../../utils/colorExtractor';
import { toImageSource } from '../../utils/mediaUri';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';


type Nav = NativeStackNavigationProp<MusicStackParamList>;

export function NowPlayingScreen(): React.ReactElement {
  const { height: SCREEN_H } = useWindowDimensions(); // Bug #3 fix: updates on rotation
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  // Bug #9 fix: grouped subscriptions → fewer re-render triggers
  const { song, playing, queue, seek, togglePlay, next, prev, setMini,
    clearQueue, handleReorder, sleepTimerAt, sleepTimerTrackId,
    setSleepTimerMinutes, setSleepTimerEndOfTrack, clearSleepTimer } = usePlayerStore(
    useShallow((s) => ({
      song: s.currentSong,
      playing: s.isPlaying,
      queue: s.queue,
      seek: s.seekTo,
      togglePlay: s.togglePlay,
      next: s.nextSong,
      prev: s.prevSong,
      setMini: s.setPlayerVisible,
      clearQueue: s.clearQueue,
      handleReorder: s.reorderQueue,
      sleepTimerAt: s.sleepTimerAt,
      sleepTimerTrackId: s.sleepTimerTrackId,
      setSleepTimerMinutes: s.setSleepTimerMinutes,
      setSleepTimerEndOfTrack: s.setSleepTimerEndOfTrack,
      clearSleepTimer: s.clearSleepTimer,
    }))
  );
  const { toggleFav, favorites } = useLibraryStore(
    useShallow((s) => ({ toggleFav: s.toggleFavorite, favorites: s.favorites }))
  );

  const { position, duration } = useProgress(250);

  const [eqOpen, setEqOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);

  const translateY = useSharedValue(0);
  const cdRotation = useSharedValue(0);
  const aura = dominantAuraColorFromSeed(song?.id ?? 'x');

  // Rotate CD when playing, stop when paused
  useEffect(() => {
    if (playing) {
      cdRotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(cdRotation);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const cdStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${cdRotation.value}deg` }],
  }));
  const onMinimize = useCallback(() => {
    setMini(false, true);
    navigation.goBack();
  }, [navigation, setMini]);

  const verticalPan = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY < -120 || e.velocityY < -800) {
        // Swipe Up -> Next: slide out to top, then slide in from bottom
        translateY.value = withTiming(-SCREEN_H, { duration: 250 }, (finished) => {
          if (finished) {
            runOnJS(next)();
            translateY.value = SCREEN_H;
            translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
          }
        });
      } else if (e.translationY > 120 || e.velocityY > 800) {
        // Swipe Down -> Prev: slide out to bottom, then slide in from top
        translateY.value = withTiming(SCREEN_H, { duration: 250 }, (finished) => {
          if (finished) {
            runOnJS(prev)();
            translateY.value = -SCREEN_H;
            translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
          }
        });
      } else {
        translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1 - Math.abs(translateY.value) / 1000,
  }));

  if (!song) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No track selected</Text>
      </View>
    );
  }

  const fav = favorites.includes(song.id);
  const sleepMin =
    sleepTimerAt == null
      ? null
      : Math.max(1, Math.ceil((sleepTimerAt - Date.now()) / (60 * 1000)));
  const sleepEnd = sleepTimerTrackId === song.id;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[softenHex(aura, 0.4), '#000']}
        style={StyleSheet.absoluteFill}
      />

      <GestureDetector gesture={verticalPan}>
        <Animated.View style={[styles.reelsContainer, animatedStyle]}>
          {/* Main Content Area */}
          <View style={styles.artWrapper}>
            {song.albumArt ? (
              <ImageBackground
                source={toImageSource(song.albumArt)}
                style={styles.fullArt}
                imageStyle={styles.fullArtImage}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.8)']}
                  style={StyleSheet.absoluteFill}
                />
                {/* Heart Button Top Right */}
                <Pressable
                  style={styles.heartButtonCorner}
                  onPress={() => toggleFav(song.id)}>
                  <MaterialCommunityIcons
                    name={fav ? 'heart' : 'heart-outline'}
                    size={32}
                    color={fav ? Colors.danger : '#fff'}
                  />
                </Pressable>
                {/* Play Button Bottom Right */}
                <Pressable
                  style={styles.playButtonCorner}
                  onPress={() => togglePlay()}>
                  <MaterialCommunityIcons
                    name={playing ? 'pause' : 'play'}
                    size={40}
                    color="#fff"
                  />
                </Pressable>
              </ImageBackground>
            ) : (
              // No album art: rotating CD vinyl + controls
              <View style={styles.fullArt}>
                <LinearGradient
                  colors={[softenHex(aura, 0.5), '#050510']}
                  style={StyleSheet.absoluteFill}
                />
                {/* Vinyl disc */}
                <Animated.View style={[styles.vinyl, cdStyle]}>
                  <LinearGradient
                    colors={['#1a1a3a', '#080818']}
                    style={styles.vinylDisc}>
                    {/* Grooves */}
                    <View style={styles.groove1} />
                    <View style={styles.groove2} />
                    {/* Center hole */}
                    <LinearGradient
                      colors={[softenHex(aura, 0.9), softenHex(aura, 0.6)]}
                      style={styles.vinylCenter}
                    />
                  </LinearGradient>
                </Animated.View>
                {/* Heart Button Top Right */}
                <Pressable
                  style={styles.heartButtonCorner}
                  onPress={() => toggleFav(song.id)}>
                  <MaterialCommunityIcons
                    name={fav ? 'heart' : 'heart-outline'}
                    size={32}
                    color={fav ? Colors.danger : '#fff'}
                  />
                </Pressable>
                {/* Play Button Bottom Right */}
                <Pressable
                  style={styles.playButtonCorner}
                  onPress={() => togglePlay()}>
                  <MaterialCommunityIcons
                    name={playing ? 'pause' : 'play'}
                    size={40}
                    color="#fff"
                  />
                </Pressable>
              </View>
            )}
          </View>

          {/* Info & Controls overlay at the bottom */}
          <View style={[styles.infoOverlay, { paddingBottom: insets.bottom + 80 }]}>
            <View style={styles.textMeta}>
              <Text numberOfLines={1} style={styles.reelsTitle}>{song.title}</Text>
              <Text numberOfLines={1} style={styles.reelsArtist}>{song.artist}</Text>
            </View>

            <ProgressBar position={position} duration={duration} onSeek={(p) => seek(p)} />

            <View style={styles.actionRow}>
              <MaterialCommunityIcons name="playlist-music" size={28} color="#fff" onPress={() => setQueueOpen(true)} />
              <MaterialCommunityIcons name="tune-vertical" size={28} color="#fff" onPress={() => setEqOpen(true)} />
              <MaterialCommunityIcons name="sleep" size={28} color="#fff" onPress={() => setSleepOpen(true)} />
              <MaterialCommunityIcons name="chevron-down" size={32} color="#fff" onPress={onMinimize} />
            </View>
          </View>
        </Animated.View>
      </GestureDetector>

      <EqualizerSheet visible={eqOpen} onClose={() => setEqOpen(false)} />
      <QueueSheet 
        visible={queueOpen} 
        onClose={() => setQueueOpen(false)} 
        queue={queue} 
        onReorder={(from, to) => handleReorder(from, to)} 
        onClearQueue={() => {
          clearQueue();
          setQueueOpen(false);
        }} 
      />
      <SleepTimerSheet
        visible={sleepOpen}
        onClose={() => setSleepOpen(false)}
        sleepMin={sleepMin}
        onSetMin={setSleepTimerMinutes}
        sleepEnd={sleepEnd}
        onToggleEnd={() => {
          if (sleepEnd) {
            clearSleepTimer();
          } else {
            setSleepTimerEndOfTrack(true);
          }
        }}
        onClear={clearSleepTimer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  emptyText: { color: '#fff' },
  reelsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 60, // Space for status bar
  },
  artWrapper: {
    flex: 1,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#111',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fullArt: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullArtImage: {
    borderRadius: 30,
  },
  cornerButton: {
    position: 'absolute',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    zIndex: 10,
  },
  playFab: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    zIndex: 10,
  },
  heartButtonCorner: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    zIndex: 10,
  },
  playButtonCorner: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    zIndex: 10,
  },
  infoOverlay: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  textMeta: {
    marginBottom: 10,
  },
  reelsTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  reelsArtist: {
    color: Colors.accent2,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  // Vinyl CD styles
  vinyl: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignSelf: 'center',
    top: '50%',
    marginTop: -110,
  },
  vinylDisc: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  groove1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  groove2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  vinylCenter: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
