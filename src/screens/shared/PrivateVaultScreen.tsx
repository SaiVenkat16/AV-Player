import React, { useEffect, useState, useMemo } from 'react';
import {
  Image,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../../styles/screens/shared/PrivateVaultStyles';

import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { PinPad } from '../../components/common/PinPad';
import { useBottomPadding } from '../../hooks/useBottomPadding';
import { useVideoPlayerStore } from '../../store/videoPlayerStore';
import { showThemedAlert } from '../../utils/themedAlert';
import { toImageSource } from '../../utils/mediaUri';
import { PrivateVideoRow } from '../../components/common/PrivateVideoRow';

export function PrivateVaultScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode: 'audio' | 'video' = route.params?.mode ?? 'audio';
  const privatePin = useLibraryStore((s) => s.privatePin);
  const bottomPadding = useBottomPadding();
  const setPrivatePin = useLibraryStore((s) => s.setPrivatePin);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const togglePrivateId = useLibraryStore((s) => s.togglePrivateId);
  const songs = useLibraryStore((s) => s.songs);
  const videos = useLibraryStore((s) => s.videos);

  const playSong = usePlayerStore((s) => s.playSong);
  const currentSongId = usePlayerStore((s) => s.currentSong?.id);

  // States
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Verify PIN or setup PIN
  const isSetupMode = privatePin === null;

  // Stop private song when leaving this screen
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      const cur = usePlayerStore.getState().currentSong;
      if (cur && privateIds.includes(cur.id)) {
        const TrackPlayer = require('react-native-track-player').default;
        TrackPlayer.reset();
        usePlayerStore.setState({ currentSong: null, isPlaying: false, queue: [], queueIndex: 0 });
      }
    });
    return unsub;
  }, [navigation, privateIds]);

  // Lock private folder when app goes to background (power button, home button)
  useEffect(() => {
    if (!isUnlocked) return;
    const { AppState } = require('react-native');
    const sub = AppState.addEventListener('change', (state: string) => {
      if (state === 'background' || state === 'inactive') {
        // Stop and reset private song completely (removes notification)
        const cur = usePlayerStore.getState().currentSong;
        if (cur && privateIds.includes(cur.id)) {
          const TrackPlayer = require('react-native-track-player').default;
          TrackPlayer.reset();
          usePlayerStore.setState({ currentSong: null, isPlaying: false, queue: [], queueIndex: 0 });
        }
        // Lock and go back
        setIsUnlocked(false);
        navigation.goBack();
      }
    });
    return () => sub.remove();
  }, [isUnlocked, navigation, privateIds]);

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);

      // Check if complete
      if (nextPin.length === 4) {
        setTimeout(() => {
          if (isSetupMode) {
            setPrivatePin(nextPin);
            showThemedAlert({ title: 'Success', message: 'Private Folder PIN has been set.', buttons: [{ text: 'OK', style: 'default' }] });
            setPinInput('');
          } else {
            if (nextPin === privatePin) {
              setIsUnlocked(true);
              setPinInput('');
            } else {
              showThemedAlert({ title: 'Error', message: 'Incorrect PIN. Please try again.', buttons: [{ text: 'OK', style: 'default' }] });
              setPinInput('');
            }
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  // Filtered Private Items
  const privateSongs = useMemo(() => {
    return songs.filter((s) => privateIds.includes(s.id));
  }, [songs, privateIds]);

  const privateVideos = useMemo(() => {
    return videos.filter((v) => privateIds.includes(v.id));
  }, [videos, privateIds]);

  // Actions
  // handleRestore is replaced by MediaActionSheet; leaving empty helper or removing is fine.
  // We can just set the state for selectedMedia.

  if (!isUnlocked && !isSetupMode) {
    return (
      <PinPad
        icon="lock-outline"
        iconColor={Colors.accent1}
        title="Enter PIN"
        subtitle="Access your secure files"
        pinLength={pinInput.length}
        onKeyPress={handleKeyPress}
        onDelete={handleDelete}
        onBackPress={() => navigation.goBack()}
      />
    );
  }

  if (isSetupMode) {
    return (
      <PinPad
        icon="shield-lock-outline"
        iconColor={Colors.accent2}
        title="Set PIN"
        subtitle="Create a 4-digit PIN to secure your private files"
        pinLength={pinInput.length}
        onKeyPress={handleKeyPress}
        onDelete={handleDelete}
        onBackPress={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text numberOfLines={1} style={styles.headerTitle}>Private Folder</Text>
        </View>
        <Pressable 
          onPress={() => {
            showThemedAlert({
              title: 'Reset PIN',
              message: 'Are you sure you want to change your PIN? Private files will remain hidden.',
              buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    setPrivatePin(null);
                    setIsUnlocked(false);
                  },
                },
              ],
            });
          }}
          style={styles.headerBtn}
          hitSlop={16}
        >
          <MaterialCommunityIcons name="key-change" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Content based on mode */}
      <View style={styles.listWrap}>
        {mode === 'audio' ? (
          privateSongs.length === 0 ? (
            <View style={styles.emptyView}>
              <MaterialCommunityIcons name="music-box-outline" size={48} color={Colors.textMuted} />
              <Text style={[Typography.body, styles.emptyText]}>No private audio files</Text>
            </View>
          ) : (
            <FlashList
              showsVerticalScrollIndicator={false}
              data={privateSongs}
              estimatedItemSize={68}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: bottomPadding }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.songRow}
                  onPress={() => playSong(item, privateSongs)}
                >
                  {item.albumArt ? (
                    <Image source={toImageSource(item.albumArt)} style={styles.songThumb} />
                  ) : (
                    <View style={[styles.songThumb, styles.songThumbPlaceholder]}>
                      <MaterialCommunityIcons name="album" size={24} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.songMeta}>
                    <Text numberOfLines={1} style={[styles.songTitle, currentSongId === item.id && styles.songTitleActive]}>{item.title}</Text>
                    <Text numberOfLines={1} style={styles.songArtist}>{item.artist}</Text>
                  </View>
                  <Pressable hitSlop={12} onPress={() => togglePrivateId(item.id)}>
                    <MaterialCommunityIcons name="lock-open-outline" size={20} color={Colors.textMuted} />
                  </Pressable>
                </Pressable>
              )}
            />
          )
        ) : (
          privateVideos.length === 0 ? (
            <View style={styles.emptyView}>
              <MaterialCommunityIcons name="video-off-outline" size={48} color={Colors.textMuted} />
              <Text style={[Typography.body, styles.emptyText]}>No private video files</Text>
            </View>
          ) : (
            <FlashList
              showsVerticalScrollIndicator={false}
              data={privateVideos}
              estimatedItemSize={88}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: bottomPadding }}
              renderItem={({ item }) => (
                <PrivateVideoRow
                  item={item}
                  onOpen={() => useVideoPlayerStore.getState().openVideo(item.id)}
                  onRestore={() => togglePrivateId(item.id)}
                />
              )}
            />
          )
        )}
      </View>
    </View>
  );
}


