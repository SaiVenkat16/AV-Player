import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import type { Song } from '../../types';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { useBottomPadding } from '../../hooks/useBottomPadding';
import { toImageSource } from '../../utils/mediaUri';

type Nav = NativeStackNavigationProp<MusicStackParamList>;
type R = RouteProp<MusicStackParamList, 'MusicFolderDetail'>;

export function MusicFolderDetailScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { folderPath, folderName } = route.params;
  const bottomPadding = useBottomPadding();

  const songs = useLibraryStore((s) => s.songs);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const favoriteIds = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const folderSongs = useMemo(() => {
    return songs.filter(
      (s) =>
        !privateIds.includes(s.id) &&
        s.path.replace(/\\/g, '/').startsWith(folderPath),
    );
  }, [songs, privateIds, folderPath]);

  const playSong = usePlayerStore((s) => s.playSong);
  const current = usePlayerStore((s) => s.currentSong);
  const addRecent = useLibraryStore((s) => s.addRecentlyPlayed);

  const [menuSong, setMenuSong] = useState<Song | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.textPrimary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text numberOfLines={1} style={s.headerTitle}>{folderName}</Text>
        </View>
        <Pressable onPress={() => {
          if (folderSongs.length > 0) {
            playSong(folderSongs[0], folderSongs);
            addRecent(folderSongs[0].id);
            navigation.navigate('NowPlaying');
          }
        }} hitSlop={12}>
          <Text style={s.playAllText}>Play all</Text>
        </Pressable>
      </View>

      {/* Song list */}
      <FlashList showsVerticalScrollIndicator={false}
        data={folderSongs}
        estimatedItemSize={64}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        renderItem={({ item }) => (
          <Pressable
            style={s.songRow}
            onPress={() => {
              playSong(item, folderSongs);
              addRecent(item.id);
              navigation.navigate('NowPlaying');
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

      {/* Popup menu */}
      <Modal
        visible={menuSong !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuSong(null)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setMenuSong(null)}>
          <View style={[s.miniModal, { top: menuPosition.y - 10 }]}>
            <Pressable style={s.miniModalItem} onPress={() => { if (menuSong) toggleFavorite(menuSong.id); setMenuSong(null); }}>
              <Text style={s.miniModalText}>
                {menuSong && favoriteIds.includes(menuSong.id) ? 'Remove from favorites' : 'Add to favorites'}
              </Text>
            </Pressable>
            <Pressable style={s.miniModalItem} onPress={() => { if (menuSong) { playSong(menuSong, [menuSong]); addRecent(menuSong.id); navigation.navigate('NowPlaying'); } setMenuSong(null); }}>
              <Text style={s.miniModalText}>Play next</Text>
            </Pressable>
            <Pressable style={s.miniModalItem} onPress={() => { if (menuSong) useLibraryStore.getState().togglePrivateId(menuSong.id); setMenuSong(null); }}>
              <Text style={s.miniModalText}>Move to private</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Poppins-Bold' },
  playAllText: { color: Colors.accent1, fontSize: 14, fontFamily: 'Poppins-Bold', paddingHorizontal: 8 },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  songThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: Colors.surface },
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
    width: 200,
    overflow: 'hidden',
    elevation: 8,
  },
  miniModalItem: { paddingHorizontal: 16, paddingVertical: 14 },
  miniModalText: { color: Colors.textPrimary, fontSize: 15, fontFamily: 'Poppins-Medium' },
});


