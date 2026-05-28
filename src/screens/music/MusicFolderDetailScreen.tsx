import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import type { Song } from '../../types';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useBottomPadding } from '../../hooks/useBottomPadding';
import { toImageSource } from '../../utils/mediaUri';
import { SelectionToolbar } from '../../components/common/SelectionToolbar';
import { showThemedAlert } from '../../utils/themedAlert';
import {
  deleteMediaFilesBulk,
  shareMediaFilesBulk,
} from '../../services/FileOpsService';

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
  const removeSongFromLibrary = useLibraryStore((s) => s.removeSongFromLibrary);

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

  // Selection mode wiring
  const selectionMode = useSelectionStore((s) => s.mode);
  const selectionActive = useSelectionStore((s) => s.isActive);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const enterSelection = useSelectionStore((s) => s.enter);
  const toggleSelection = useSelectionStore((s) => s.toggle);
  const exitSelection = useSelectionStore((s) => s.exit);
  const selectAll = useSelectionStore((s) => s.selectAll);
  const isAudioSelectMode = selectionActive && selectionMode === 'audio';

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (useSelectionStore.getState().mode === 'audio') {
          useSelectionStore.getState().exit();
        }
      };
    }, []),
  );

  useEffect(() => {
    if (!isAudioSelectMode) return;
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (useSelectionStore.getState().isActive) {
        e.preventDefault();
        exitSelection();
      }
    });
    return sub;
  }, [navigation, isAudioSelectMode, exitSelection]);

  const handleItemLongPress = useCallback(
    (song: Song) => {
      if (isAudioSelectMode) return;
      enterSelection('audio', song.id);
    },
    [isAudioSelectMode, enterSelection],
  );

  const handleItemPress = useCallback(
    (song: Song) => {
      if (isAudioSelectMode) {
        toggleSelection(song.id);
      } else {
        playSong(song, folderSongs);
        addRecent(song.id);
        navigation.navigate('NowPlaying');
      }
    },
    [
      isAudioSelectMode,
      toggleSelection,
      playSong,
      folderSongs,
      addRecent,
      navigation,
    ],
  );

  const handleSelectAll = useCallback(() => {
    const allIds = folderSongs.map((sg) => sg.id);
    const isAllSelected =
      allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    if (isAllSelected) {
      useSelectionStore.getState().clear();
    } else {
      selectAll(allIds);
    }
  }, [selectAll, folderSongs, selectedIds]);

  const selectedSongs = useMemo(
    () => folderSongs.filter((sg) => selectedIds.includes(sg.id)),
    [folderSongs, selectedIds],
  );

  const handleBulkShare = useCallback(async () => {
    if (selectedSongs.length === 0) return;
    await shareMediaFilesBulk(
      selectedSongs.map((sg) => sg.path),
      false,
    );
  }, [selectedSongs]);

  const handleBulkDelete = useCallback(() => {
    if (selectedSongs.length === 0) return;
    showThemedAlert({
      title: `Delete ${selectedSongs.length} songs?`,
      message: 'This will permanently delete the selected songs from your device.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const deleted = await deleteMediaFilesBulk(
              selectedSongs.map((sg) => sg.path),
              false,
            );
            if (deleted > 0) {
              for (const sg of selectedSongs) {
                removeSongFromLibrary(sg.id);
              }
              exitSelection();
            }
          },
        },
      ],
    });
  }, [selectedSongs, removeSongFromLibrary, exitSelection]);

  return (
    <View style={s.root}>
      {isAudioSelectMode ? (
        <SelectionToolbar
          count={selectedIds.length}
          onClose={exitSelection}
          onSelectAll={handleSelectAll}
          onShare={handleBulkShare}
          onDelete={handleBulkDelete}
        />
      ) : (
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
      )}

      <FlashList showsVerticalScrollIndicator={false}
        data={folderSongs}
        estimatedItemSize={64}
        keyExtractor={(item) => item.id}
        extraData={`${isAudioSelectMode ? '1' : '0'}|${selectedIds.join(',')}`}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          return (
            <Pressable
              style={[s.songRow, selected && s.songRowSelected]}
              onPress={() => handleItemPress(item)}
              onLongPress={() => handleItemLongPress(item)}
            >
              {isAudioSelectMode && (
                <MaterialCommunityIcons
                  name={
                    selected
                      ? 'checkbox-marked-circle'
                      : 'checkbox-blank-circle-outline'
                  }
                  size={22}
                  color={selected ? Colors.accent1 : Colors.textMuted}
                  style={s.selectIcon}
                />
              )}
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
              {!isAudioSelectMode && (
                <Pressable hitSlop={12} onPress={(e) => {
                  setMenuPosition({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
                  setMenuSong(item);
                }}>
                  <MaterialCommunityIcons name="dots-vertical" size={20} color={Colors.textMuted} />
                </Pressable>
              )}
            </Pressable>
          );
        }}
      />

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
  songRowSelected: { backgroundColor: 'rgba(168,85,247,0.18)' },
  selectIcon: { marginRight: 4 },
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
