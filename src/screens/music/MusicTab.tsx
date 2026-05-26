import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BluetoothSheet } from '../../components/bluetooth/BluetoothSheet';
import { Colors } from '../../theme/colors';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import { useBluetoothPoll } from '../../hooks/useBluetooth';
import { getAlbumsFromSongs, useLibraryStore } from '../../store/libraryStore';
import { useLibrary } from '../../hooks/useLibrary';
import { usePlayerStore } from '../../store/playerStore';
import { useSearchStore } from '../../store/searchStore';
import type { Song } from '../../types';
import { sortSongs } from '../../utils/musicUtils';
import { toImageSource } from '../../utils/mediaUri';
import { formatTime } from '../../utils/formatTime';
import { useBottomPadding } from '../../hooks/useBottomPadding';
import { HomeHeader } from '../../components/layout/HomeHeader';

type Nav = NativeStackNavigationProp<MusicStackParamList>;

export function MusicTab(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();

  const {
    songs,
    addRecentlyPlayed: addRecent,
    privateIds,
    recentlyPlayed,
    favorites: favoriteIds,
    toggleFavorite,
    scanLibrary,
    isScanning,
  } = useLibrary();

  const playSong = usePlayerStore((s) => s.playSong);
  const currentSongId = usePlayerStore((s) => s.currentSong?.id);

  const [btOpen, setBtOpen] = useState(false);
  const [menuSong, setMenuSong] = useState<Song | null>(null);
  const [menuPosition, setMenuPosition] = useState(0);

  const openBluetoothParam = route.params?.openBluetooth;
  React.useEffect(() => {
    if (openBluetoothParam) {
      setBtOpen(true);
      navigation.setParams({ openBluetooth: undefined } as any);
    }
  }, [openBluetoothParam, navigation]);

  const { devices, refresh } = useBluetoothPoll(btOpen);
  const bottomPadding = useBottomPadding();

  const searchQuery = useSearchStore((s) => s.query);
  const isSearchOpen = useSearchStore((s) => s.isSearchOpen);

  // ── Visible songs (exclude private) ──
  const visibleSongs = useMemo(
    () => songs.filter((s) => !privateIds.includes(s.id)),
    [songs, privateIds],
  );

  // Folders to hide from "All Songs" (shown only in Folders section)
  const HIDDEN_FOLDERS = useMemo(() => ['call', 'recorder', 'recordings', 'whatsapp audio', 'ringtones', 'notifications', 'alarms', 'voice'], []);

  // ── Music-only songs (filtered for All Songs) ──
  const musicSongs = useMemo(() => {
    return visibleSongs.filter((s) => {
      const parts = s.path.replace(/\\/g, '/').split('/');
      const folderName = (parts[parts.length - 2] || '').toLowerCase();
      return !HIDDEN_FOLDERS.includes(folderName);
    });
  }, [visibleSongs, HIDDEN_FOLDERS]);

  // ── All folders (for Folders section) ──
  const audioFolders = useMemo(() => {
    const map = new Map<string, { folderPath: string; folderName: string; count: number }>();
    for (const s of visibleSongs) {
      const parts = s.path.replace(/\\/g, '/').split('/');
      const folderPath = parts.slice(0, -1).join('/');
      const folderName = parts[parts.length - 2] || 'Storage';
      if (!map.has(folderPath)) {
        map.set(folderPath, { folderPath, folderName, count: 0 });
      }
      map.get(folderPath)!.count++;
    }
    return [...map.values()].sort((a, b) => a.folderName.localeCompare(b.folderName));
  }, [visibleSongs]);

  // ── Search filter (applies to musicSongs) ──
  const filteredSongs = useMemo(() => {
    if (isSearchOpen && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return musicSongs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q),
      );
    }
    return musicSongs;
  }, [musicSongs, isSearchOpen, searchQuery]);

  // ── Most Played (recently played order) ──
  const mostPlayed = useMemo(() => {
    const songMap = new Map(filteredSongs.map((s) => [s.id, s]));
    return recentlyPlayed
      .map((id) => songMap.get(id))
      .filter((s): s is Song => s != null)
      .slice(0, 20);
  }, [filteredSongs, recentlyPlayed]);

  // ── Albums ──
  const albums = useMemo(() => getAlbumsFromSongs(filteredSongs), [filteredSongs]);

  // ── Sorted songs (memoized to avoid re-sorting on every render) ──
  const sortedSongs = useMemo(() => sortSongs(filteredSongs, 'az'), [filteredSongs]);

  const handlePlaySong = useCallback(
    (song: Song, list: Song[]) => {
      const current = usePlayerStore.getState().currentSong;
      if (current?.id === song.id) {
        // Already playing this song - just navigate to NowPlaying
        navigation.navigate('NowPlaying');
        return;
      }
      playSong(song, list);
      addRecent(song.id);
      navigation.navigate('NowPlaying');
    },
    [playSong, addRecent, navigation],
  );

  // ── Search results mode ──
  if (isSearchOpen && searchQuery.trim()) {
    const sorted = sortedSongs;
    return (
      <View style={s.root}>
        <HomeHeader mode="audio" />
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          renderItem={({ item }) => (
            <Pressable
              style={s.searchRow}
              onPress={() => handlePlaySong(item, sorted)}
            >
              {item.albumArt ? (
                <Image source={toImageSource(item.albumArt)} style={s.searchThumb} />
              ) : (
                <View style={[s.searchThumb, s.placeholderThumb]}>
                  <MaterialCommunityIcons name="album" size={30} color={Colors.textMuted} />
                </View>
              )}
              <View style={s.searchMeta}>
                <Text numberOfLines={1} style={s.searchTitle}>{item.title}</Text>
                <Text numberOfLines={1} style={s.searchArtist}>{item.artist}</Text>
              </View>
              <Text style={s.searchDur}>{formatTime(item.duration)}</Text>
            </Pressable>
          )}
        />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <HomeHeader mode="audio" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isScanning}
            onRefresh={scanLibrary}
            tintColor={Colors.accent1}
            colors={[Colors.accent1]}
            progressBackgroundColor={Colors.surfaceElevated}
          />
        }
      >
        {/* ── Most Played Section (horizontal scroll, song rows) ── */}
        {mostPlayed.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Most Played</Text>
              <View style={s.headerBtns}>
                <Pressable style={s.playAllBtn} hitSlop={12} onPress={() => {
                  const shuffled = [...mostPlayed].sort(() => Math.random() - 0.5);
                  if (shuffled.length > 0) {
                    usePlayerStore.setState({ shuffleMode: true });
                    playSong(shuffled[0], shuffled);
                    addRecent(shuffled[0].id);
                    navigation.navigate('NowPlaying');
                  }
                }}>
                  <MaterialCommunityIcons name="shuffle" size={16} color={Colors.textPrimary} />
                </Pressable>
              </View>
            </View>
            <FlatList
              data={(() => {
                // Group into chunks of 4 for vertical columns, max 5 pages (20 songs)
                const chunks = [];
                for (let i = 0; i < Math.min(mostPlayed.length, 20); i += 4) {
                  chunks.push(mostPlayed.slice(i, i + 4));
                }
                return chunks.slice(0, 5);
              })()}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={Dimensions.get('window').width - 32}
              decelerationRate="fast"
              keyExtractor={(_, idx) => `chunk-${idx}`}
              contentContainerStyle={s.hListSnap}
              renderItem={({ item: chunk }) => (
                <View style={s.mostPlayedColumn}>
                  {chunk.map((item) => (
                    <Pressable
                      key={item.id}
                      style={s.pickRow}
                      onPress={() => handlePlaySong(item, mostPlayed)}
                    >
                      {item.albumArt ? (
                        <Image source={toImageSource(item.albumArt)} style={s.pickThumb} />
                      ) : (
                        <View style={[s.pickThumb, s.placeholderThumb]}>
                          <MaterialCommunityIcons name="album" size={32} color={Colors.textMuted} />
                        </View>
                      )}
                      <View style={s.pickMeta}>
                        <Text numberOfLines={1} style={[s.pickTitle, currentSongId === item.id && s.pickTitleActive]}>{item.title}</Text>
                        <Text numberOfLines={1} style={s.pickArtist}>{item.artist}</Text>
                      </View>
                      <Pressable hitSlop={12} onPress={(e) => { setMenuPosition(e.nativeEvent.pageY); setMenuSong(item); }}>
                        <MaterialCommunityIcons name="dots-vertical" size={20} color={Colors.textMuted} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>
        )}

        {/* ── All Songs Section (vertical list) ── */}
        {filteredSongs.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>All Songs</Text>
              <View style={s.headerBtns}>
                <Pressable style={s.playAllBtn} hitSlop={12} onPress={() => {
                  const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
                  if (shuffled.length > 0) {
                    usePlayerStore.setState({ shuffleMode: true });
                    playSong(shuffled[0], shuffled);
                    addRecent(shuffled[0].id);
                    navigation.navigate('NowPlaying');
                  }
                }}>
                  <MaterialCommunityIcons name="shuffle" size={16} color={Colors.textPrimary} />
                </Pressable>
              </View>
            </View>
            <FlatList
              data={(() => {
                const sorted = sortedSongs;
                const chunks = [];
                for (let i = 0; i < Math.min(sorted.length, 20); i += 4) {
                  chunks.push(sorted.slice(i, i + 4));
                }
                return chunks.slice(0, 5);
              })()}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={Dimensions.get('window').width - 32}
              decelerationRate="fast"
              keyExtractor={(_, idx) => `allsongs-${idx}`}
              contentContainerStyle={s.hListSnap}
              renderItem={({ item: chunk }) => (
                <View style={s.mostPlayedColumn}>
                  {chunk.map((item) => (
                    <Pressable
                      key={item.id}
                      style={s.pickRow}
                      onPress={() => handlePlaySong(item, sortedSongs)}
                    >
                      {item.albumArt ? (
                        <Image source={toImageSource(item.albumArt)} style={s.pickThumb} />
                      ) : (
                        <View style={[s.pickThumb, s.placeholderThumb]}>
                          <MaterialCommunityIcons name="album" size={32} color={Colors.textMuted} />
                        </View>
                      )}
                      <View style={s.pickMeta}>
                        <Text numberOfLines={1} style={[s.pickTitle, currentSongId === item.id && s.pickTitleActive]}>{item.title}</Text>
                        <Text numberOfLines={1} style={s.pickArtist}>{item.artist}</Text>
                      </View>
                      <Pressable hitSlop={12} onPress={(e) => { setMenuPosition(e.nativeEvent.pageY); setMenuSong(item); }}>
                        <MaterialCommunityIcons name="dots-vertical" size={20} color={Colors.textMuted} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>
        )}

        {/* ── Albums Section (3x3 grid + See All) ── */}
        {albums.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Albums</Text>
              {albums.length > 6 && (
                <Pressable style={s.playAllBtn} onPress={() => navigation.navigate('AllAlbums')}>
                  <Text style={s.playAllText}>See all</Text>
                </Pressable>
              )}
            </View>
            <View style={s.albumGrid}>
              {albums.slice(0, 6).map((item) => (
                <Pressable
                  key={item.id}
                  style={s.albumGridItem}
                  onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id })}
                >
                  <View style={s.albumArtWrap}>
                    {item.artUri ? (
                      <Image source={toImageSource(item.artUri)} style={s.albumArt} />
                    ) : (
                      <View style={[s.albumArt, s.placeholderArt]}>
                        <MaterialCommunityIcons name="album" size={40} color={Colors.textMuted} />
                      </View>
                    )}
                    <Pressable
                      style={s.albumPlayBtn}
                      onPress={() => {
                        const albumSongs = filteredSongs.filter((song) => item.songIds.includes(song.id));
                        if (albumSongs.length > 0) {
                          playSong(albumSongs[0], albumSongs);
                          addRecent(albumSongs[0].id);
                          navigation.navigate('NowPlaying');
                        }
                      }}
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons name="play" size={18} color="#fff" />
                    </Pressable>
                  </View>
                  <Text numberOfLines={1} style={s.albumName}>{item.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Folders Section (horizontal scroll) ── */}
        {audioFolders.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, s.sectionTitleStandalone]}>Folders</Text>
            <FlatList
              data={audioFolders}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.folderPath}
              contentContainerStyle={s.hList}
              renderItem={({ item }) => {
                const folderLower = item.folderName.toLowerCase();
                let innerIcon = 'music-note';
                let innerColor = Colors.accent1;
                if (folderLower.includes('call') || folderLower.includes('record')) {
                  innerIcon = 'phone';
                  innerColor = '#10B981';
                } else if (folderLower.includes('whatsapp')) {
                  innerIcon = 'whatsapp';
                  innerColor = '#25D366';
                } else if (folderLower.includes('download')) {
                  innerIcon = 'download';
                  innerColor = '#3B82F6';
                } else if (folderLower.includes('ringtone')) {
                  innerIcon = 'bell-ring';
                  innerColor = '#F59E0B';
                } else if (folderLower.includes('notification') || folderLower.includes('alarm')) {
                  innerIcon = 'bell';
                  innerColor = '#F59E0B';
                } else if (folderLower.includes('voice') || folderLower.includes('memo')) {
                  innerIcon = 'microphone';
                  innerColor = '#8B5CF6';
                } else if (folderLower.includes('telegram')) {
                  innerIcon = 'send';
                  innerColor = '#0088CC';
                }
                return (
                <Pressable
                  style={s.folderCard}
                  onPress={() => navigation.navigate('MusicFolderDetail', { folderPath: item.folderPath, folderName: item.folderName })}
                >
                  <View style={s.folderIcon}>
                    <MaterialCommunityIcons name="folder" size={100} color={Colors.textMuted} />
                    <View style={s.folderInnerIcon}>
                      <MaterialCommunityIcons name={innerIcon} size={28} color={innerColor} />
                    </View>
                  </View>
                  <Text numberOfLines={1} style={s.folderName}>{item.folderName}</Text>
                  <Text style={s.folderCount}>{item.count} songs</Text>
                </Pressable>
                );
              }}
            />
          </View>
        )}
      </ScrollView>

      {/* Small song options popup near 3-dot */}
      <Modal
        visible={menuSong !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuSong(null)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setMenuSong(null)}>
          <View style={[s.miniModal, { top: menuPosition - 10 }]}>
            <Pressable style={s.miniModalItem} onPress={() => { if (menuSong) toggleFavorite(menuSong.id); setMenuSong(null); }}>
              <Text style={s.miniModalText}>
                {menuSong && favoriteIds.includes(menuSong.id) ? 'Remove from favorites' : 'Add to favorites'}
              </Text>
            </Pressable>
            <Pressable style={s.miniModalItem} onPress={() => {
              if (menuSong) {
                const albumKey = (menuSong.album?.trim().toLowerCase() || '') === '' ||
                  menuSong.album?.trim().toLowerCase() === 'unknown' ||
                  menuSong.album?.trim().toLowerCase() === 'unknown album'
                  ? '__unknown__'
                  : menuSong.album.trim().replace(/\s*[([]\d{4}[)\]]\s*$/, '').toLowerCase();
                navigation.navigate('AlbumDetail', { albumId: albumKey });
              }
              setMenuSong(null);
            }}>
              <Text style={s.miniModalText}>Go to album</Text>
            </Pressable>
            <Pressable style={s.miniModalItem} onPress={() => {
              if (menuSong) {
                useLibraryStore.getState().togglePrivateId(menuSong.id);
              }
              setMenuSong(null);
            }}>
              <Text style={s.miniModalText}>Move to private</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <BluetoothSheet
        visible={btOpen}
        onClose={() => setBtOpen(false)}
        devices={devices}
        onRefresh={refresh}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // ── Sections ──
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  sectionTitleStandalone: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  playAllBtn: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  playAllText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  hList: { paddingHorizontal: 16, gap: 12 },
  hListSnap: { paddingLeft: 16 },

  // ── Quick Picks rows (vertical list) ──
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  pickThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  pickMeta: { flex: 1, overflow: 'hidden' },
  pickTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  pickTitleActive: {
    color: Colors.accent1,
  },
  pickArtist: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  // ── Album Grid (3x3) ──
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  albumGridItem: {
    width: (Dimensions.get('window').width - 24 - 24) / 3,
    marginBottom: 8,
  },
  albumArtWrap: {
    position: 'relative',
  },
  albumArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  albumPlayBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  albumName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 6,
  },
  albumSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  // ── Most Played (horizontal scroll, 4 songs per column) ──
  mostPlayedColumn: {
    width: Dimensions.get('window').width - 32,
    paddingHorizontal: 12,
  },
  placeholderArt: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  placeholderThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },

  // ── Folder Cards ──
  folderCard: {
    width: 140,
    alignItems: 'center',
  },
  folderIcon: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  folderInnerIcon: {
    position: 'absolute',
  },
  folderName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginTop: 6,
  },
  folderCount: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  // ── Small Options Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  miniModalItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  miniModalText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
  },

  // ── Search Results ──
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  searchThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  searchMeta: { flex: 1 },
  searchTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  searchArtist: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  searchDur: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});



