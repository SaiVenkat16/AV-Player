import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import type { Song, Video } from '../../types';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { useVideoPlayerStore } from '../../store/videoPlayerStore';
import { styles } from '../../styles/screens/shared/FavoritesStyles';
import { useBottomPadding } from '../../hooks/useBottomPadding';
import { toImageSource } from '../../utils/mediaUri';

export function FavoritesScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode: 'audio' | 'video' = route.params?.mode ?? 'audio';
  const bottomPadding = useBottomPadding();

  const songs = useLibraryStore((s) => s.songs);
  const videos = useLibraryStore((s) => s.videos);
  const favoriteIds = useLibraryStore((s) => s.favorites);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const addRecent = useLibraryStore((s) => s.addRecentlyPlayed);

  const playSong = usePlayerStore((s) => s.playSong);
  const current = usePlayerStore((s) => s.currentSong);

  const [menuSong, setMenuSong] = useState<Song | null>(null);
  const [menuVideo, setMenuVideo] = useState<Video | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const favoriteSongs = useMemo(
    () =>
      songs.filter(
        (s) => favoriteIds.includes(s.id) && !privateIds.includes(s.id),
      ),
    [songs, favoriteIds, privateIds],
  );

  const favoriteVideos = useMemo(
    () =>
      videos.filter(
        (v) => favoriteIds.includes(v.id) && !privateIds.includes(v.id),
      ),
    [videos, favoriteIds, privateIds],
  );

  const isAudio = mode === 'audio';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.textPrimary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text numberOfLines={1} style={s.headerTitle}>
            {isAudio ? 'Favorite Songs' : 'Favorite Videos'}
          </Text>
        </View>
        {isAudio && favoriteSongs.length > 0 ? (
          <Pressable
            style={s.playAllBtn}
            onPress={() => {
              const shuffled = [...favoriteSongs].sort(() => Math.random() - 0.5);
              playSong(shuffled[0], shuffled);
              addRecent(shuffled[0].id);
              navigation.navigate('Music', { screen: 'NowPlaying' });
            }}
            hitSlop={12}
          >
            <Text style={s.playAllText}>Play all</Text>
          </Pressable>
        ) : (
          <View style={s.spacer} />
        )}
      </View>

      {/* Content */}
      <View style={styles.listWrap}>
        {isAudio ? (
          favoriteSongs.length === 0 ? (
            <View style={styles.emptyView}>
              <MaterialCommunityIcons name="heart-broken-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No favorite songs yet</Text>
            </View>
          ) : (
            <FlashList showsVerticalScrollIndicator={false}
              data={favoriteSongs}
              estimatedItemSize={64}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: bottomPadding }}
              renderItem={({ item }) => (
                <Pressable
                  style={s.songRow}
                  onPress={() => {
                    playSong(item, favoriteSongs);
                    addRecent(item.id);
                    navigation.navigate('Music', { screen: 'NowPlaying' });
                  }}
                >
                  {item.albumArt ? (
                    <Image source={toImageSource(item.albumArt)} style={s.songThumb} />
                  ) : (
                    <View style={[s.songThumb, s.songThumbPlaceholder]}>
                      <MaterialCommunityIcons name="album" size={24} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={s.songMeta}>
                    <Text numberOfLines={1} style={[s.songTitle, current?.id === item.id && s.songTitleActive]}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={s.songArtist}>{item.artist}</Text>
                  </View>
                  <Pressable hitSlop={12} onPress={(e) => {
                    setMenuPosition({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
                    setMenuSong(item);
                  }}>
                    <MaterialCommunityIcons name="dots-vertical" size={20} color={Colors.textMuted} />
                  </Pressable>
                </Pressable>
              )}
            />
          )
        ) : favoriteVideos.length === 0 ? (
          <View style={styles.emptyView}>
            <MaterialCommunityIcons name="heart-broken-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No favorite videos yet</Text>
          </View>
        ) : (
          <FlashList showsVerticalScrollIndicator={false}
            data={favoriteVideos}
            estimatedItemSize={72}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: bottomPadding }}
            renderItem={({ item }) => (
              <Pressable
                style={s.songRow}
                onPress={() => {
                  useVideoPlayerStore.getState().openVideo(item.id);
                }}
              >
                {item.thumbnailUri ? (
                  <Image
                    source={toImageSource(item.thumbnailUri)}
                    style={s.videoThumb}
                  />
                ) : (
                  <View style={[s.videoThumb, s.songThumbPlaceholder]}>
                    <MaterialCommunityIcons
                      name="play-circle-outline"
                      size={26}
                      color={Colors.accent1}
                    />
                  </View>
                )}
                <View style={s.songMeta}>
                  <Text numberOfLines={1} style={s.songTitle}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={s.songArtist}>
                    {item.width > 0 && item.height > 0
                      ? `${item.width}×${item.height}`
                      : 'Video'}
                  </Text>
                </View>
                <Pressable
                  hitSlop={12}
                  onPress={(e) => {
                    setMenuPosition({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
                    setMenuVideo(item);
                  }}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={20}
                    color={Colors.textMuted}
                  />
                </Pressable>
              </Pressable>
            )}
          />
        )}
      </View>

      {/* 3-dot popup (audio) */}
      <Modal
        visible={menuSong !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuSong(null)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setMenuSong(null)}>
          <View style={[s.miniModal, { top: menuPosition.y - 10 }]}>
            <Pressable style={s.miniModalItem} onPress={() => { if (menuSong) toggleFavorite(menuSong.id); setMenuSong(null); }}>
              <Text style={s.miniModalText}>Remove from favorites</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* 3-dot popup (video) */}
      <Modal
        visible={menuVideo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVideo(null)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setMenuVideo(null)}>
          <View style={[s.miniModal, { top: menuPosition.y - 10 }]}>
            <Pressable
              style={s.miniModalItem}
              onPress={() => {
                if (menuVideo) toggleFavorite(menuVideo.id);
                setMenuVideo(null);
              }}
            >
              <Text style={s.miniModalText}>Remove from favorites</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  spacer: { width: 40 },
  playAllBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  playAllText: { color: Colors.accent1, fontSize: 14, fontFamily: 'Poppins-Bold' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Poppins-Bold' },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  songThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: Colors.surface },
  videoThumb: { width: 88, height: 50, borderRadius: 8, backgroundColor: Colors.surface },
  songThumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceElevated },
  songMeta: { flex: 1 },
  songTitle: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  songTitleActive: { color: Colors.accent1 },
  songArtist: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  miniModal: {
    position: 'absolute',
    right: 16,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    width: 220,
    overflow: 'hidden',
    elevation: 8,
  },
  miniModalItem: { paddingHorizontal: 16, paddingVertical: 14 },
  miniModalText: { color: Colors.textPrimary, fontSize: 15, fontFamily: 'Poppins-Medium' },
});
