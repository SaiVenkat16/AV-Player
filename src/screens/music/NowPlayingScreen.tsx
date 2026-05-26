import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  StatusBar,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../../styles/screens/music/NowPlayingStyles';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useProgress } from 'react-native-track-player';
import { useShallow } from 'zustand/react/shallow';
import { ProgressBar } from '../../components/player/ProgressBar';
import { EqualizerSheet } from '../../components/equalizer/EqualizerSheet';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import { usePlayerStore } from '../../store/playerStore';
import { useLibraryStore } from '../../store/libraryStore';
import { Colors } from '../../theme/colors';
import { toImageSource } from '../../utils/mediaUri';

type Nav = NativeStackNavigationProp<MusicStackParamList>;

export function NowPlayingScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const { song, playing, seek, togglePlay, setMini,
    nextSong, prevSong, queue, queueIndex,
    sleepTimerAt, sleepTimerTrackId,
    setSleepTimerMinutes, setSleepTimerEndOfTrack, clearSleepTimer,
    shuffleMode, toggleShuffle, repeatMode, cycleRepeat } = usePlayerStore(
    useShallow((s) => ({
      song: s.currentSong,
      playing: s.isPlaying,
      seek: s.seekTo,
      togglePlay: s.togglePlay,
      setMini: s.setPlayerVisible,
      nextSong: s.nextSong,
      prevSong: s.prevSong,
      queue: s.queue,
      queueIndex: s.queueIndex,
      sleepTimerAt: s.sleepTimerAt,
      sleepTimerTrackId: s.sleepTimerTrackId,
      setSleepTimerMinutes: s.setSleepTimerMinutes,
      setSleepTimerEndOfTrack: s.setSleepTimerEndOfTrack,
      clearSleepTimer: s.clearSleepTimer,
      shuffleMode: s.shuffleMode,
      toggleShuffle: s.toggleShuffle,
      repeatMode: s.repeatMode,
      cycleRepeat: s.cycleRepeat,
    }))
  );
  const { toggleFav, favorites } = useLibraryStore(
    useShallow((s) => ({ toggleFav: s.toggleFavorite, favorites: s.favorites }))
  );

  const { position, duration } = useProgress(250);

  const [eqOpen, setEqOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);

  const onMinimize = useCallback(() => {
    setMini(false, true);
    navigation.goBack();
  }, [navigation, setMini]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      setMini(false, true);
    });
    return unsub;
  }, [navigation, setMini]);

  if (!song) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No track selected</Text>
      </View>
    );
  }

  const fav = favorites.includes(song.id);

  // Swipe to change song - no animation, instant change
  const isLastSong = queueIndex >= queue.length - 1 && repeatMode === 'off';
  const isFirstSong = queueIndex <= 0;

  const swipeGesture = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationY < -80 && !isLastSong) {
        runOnJS(nextSong)();
      } else if (e.translationY > 80 && !isFirstSong) {
        runOnJS(prevSong)();
      }
    });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <GestureDetector gesture={swipeGesture}>
        <View style={styles.gestureWrap}>

      {/* Header: minimize + title */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onMinimize} hitSlop={16}>
          <MaterialCommunityIcons name="chevron-down" size={30} color="#fff" />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>Now Playing</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Album Art - large with overlay buttons */}
      <View style={styles.artContainer}>
        {song.albumArt ? (
          <Image key={song.id} source={toImageSource(song.albumArt)} style={styles.art} resizeMode="cover" />
        ) : (
          <View key={song.id} style={[styles.art, styles.artPlaceholder]}>
            <MaterialCommunityIcons name="album" size={140} color={Colors.textMuted} />
          </View>
        )}
        {/* Heart - top right */}
        <Pressable onPress={() => toggleFav(song.id)} hitSlop={16} style={styles.heartOnArt}>
          <MaterialCommunityIcons
            name={fav ? 'heart' : 'heart-outline'}
            size={28}
            color={fav ? '#ef4444' : '#fff'}
          />
        </Pressable>
      </View>

      {/* Song info */}
      <View style={styles.infoRow}>
        <View style={styles.infoText}>
          <Text numberOfLines={1} style={styles.title}>{song.title}</Text>
          <Text numberOfLines={1} style={styles.artist}>{song.artist}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <ProgressBar position={position} duration={duration} onSeek={(p) => seek(p)} />
      </View>

      {/* Options row - middle */}
      <View style={styles.bottomRow}>
        <Pressable onPress={toggleShuffle} hitSlop={16}>
          <MaterialCommunityIcons
            name="shuffle"
            size={24}
            color={shuffleMode ? Colors.accent1 : '#fff'}
          />
        </Pressable>
        <Pressable onPress={() => setEqOpen(true)} hitSlop={16}>
          <MaterialCommunityIcons name="tune-vertical" size={24} color="#fff" />
        </Pressable>
        <Pressable onPress={() => setSleepOpen(true)} hitSlop={16}>
          <MaterialCommunityIcons name="sleep" size={24} color="#fff" />
        </Pressable>
        <Pressable onPress={cycleRepeat} hitSlop={16}>
          <MaterialCommunityIcons
            name={repeatMode === 'one' ? 'repeat-once' : 'repeat'}
            size={24}
            color={repeatMode !== 'off' ? Colors.accent1 : '#fff'}
          />
        </Pressable>
      </View>

      {/* Playback controls - bottom */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={prevSong} hitSlop={16}>
          <MaterialCommunityIcons name="skip-previous" size={32} color="#fff" />
        </Pressable>
        <Pressable onPress={togglePlay} style={styles.playBtn}>
          <MaterialCommunityIcons name={playing ? 'pause' : 'play'} size={34} color="#000" />
        </Pressable>
        <Pressable onPress={nextSong} hitSlop={16}>
          <MaterialCommunityIcons name="skip-next" size={32} color="#fff" />
        </Pressable>
      </View>

        </View>
      </GestureDetector>

      <EqualizerSheet visible={eqOpen} onClose={() => setEqOpen(false)} />

      {/* Sleep Timer - centered modal */}
      <Modal
        visible={sleepOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSleepOpen(false)}
      >
        <Pressable style={styles.sleepBackdrop} onPress={() => setSleepOpen(false)}>
          <View style={styles.sleepModal}>
            <Text style={styles.sleepTitle}>Sleep Timer</Text>
            <Text style={styles.sleepInfo}>
              {sleepTimerAt != null
                ? `Stopping in ${Math.max(1, Math.ceil((sleepTimerAt - Date.now()) / 60000))} min`
                : 'Pick duration'}
            </Text>
            <View style={styles.sleepChips}>
              {[5, 10, 15, 30, 45, 60].map((m) => (
                <Pressable key={m} style={styles.sleepChip} onPress={() => { setSleepTimerMinutes(m); setSleepOpen(false); }}>
                  <Text style={styles.sleepChipText}>{m}m</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.sleepEndRow} onPress={() => {
              if (sleepTimerTrackId === song.id) clearSleepTimer();
              else setSleepTimerEndOfTrack(true);
              setSleepOpen(false);
            }}>
              <View style={styles.sleepEndInner}>
                <View style={[styles.sleepCheckbox, sleepTimerTrackId === song.id && styles.sleepCheckboxOn]} />
                <Text style={styles.sleepEndText}>End of current song</Text>
              </View>
            </Pressable>
            {(sleepTimerAt != null || sleepTimerTrackId === song.id) && (
              <Pressable style={styles.sleepClearBtn} onPress={() => { clearSleepTimer(); setSleepOpen(false); }}>
                <Text style={styles.sleepClearText}>Clear timer</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
