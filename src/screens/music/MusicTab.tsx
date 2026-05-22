import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { BluetoothSheet } from '../../components/bluetooth/BluetoothSheet';
import { SongRow } from '../../components/library/SongRow';
import { AlbumCard } from '../../components/library/AlbumCard';
import { MusicHeader } from '../../components/music/MusicHeader';
import { Colors } from '../../theme/colors';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import { useBluetoothPoll } from '../../hooks/useBluetooth';
import { useLibraryStore, getAlbumsFromSongs, getArtistsFromSongs } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import type { Song, Album, Artist } from '../../types';
import { sortSongs } from '../../utils/musicUtils';
import { toImageSource } from '../../utils/mediaUri';

type Nav = NativeStackNavigationProp<MusicStackParamList>;
type Tab = 'songs' | 'albums' | 'artists' | 'categories';

// ─── Category type ────────────────────────────────────────────────────────────
type CategoryGroup = {
  key: string;
  label: string;
  icon: string;
  color: string[];
  songs: Song[];
};

function buildCategories(songs: Song[]): CategoryGroup[] {
  const genreMap = new Map<string, Song[]>();
  const moodMap = new Map<string, Song[]>();

  for (const s of songs) {
    const genre = s.genre?.trim() || 'Unknown';
    if (!genreMap.has(genre)) genreMap.set(genre, []);
    genreMap.get(genre)!.push(s);

    const mood = s.mood?.trim() || 'Chill';
    if (!moodMap.has(mood)) moodMap.set(mood, []);
    moodMap.get(mood)!.push(s);
  }

  const moodMeta: Record<string, { icon: string; color: string[] }> = {
    Energetic: { icon: 'lightning-bolt', color: ['#F59E0B', '#EF4444'] },
    Chill: { icon: 'weather-sunset', color: ['#06B6D4', '#3B82F6'] },
    Happy: { icon: 'emoticon-happy-outline', color: ['#10B981', '#34D399'] },
    Sad: { icon: 'weather-rainy', color: ['#6366F1', '#8B5CF6'] },
    Focus: { icon: 'brain', color: ['#A855F7', '#6366F1'] },
    Party: { icon: 'party-popper', color: ['#EC4899', '#F59E0B'] },
  };

  const categories: CategoryGroup[] = [];

  // Add mood groups
  for (const [mood, list] of moodMap.entries()) {
    const meta = moodMeta[mood] ?? { icon: 'music-note', color: ['#64748B', '#475569'] };
    categories.push({
      key: `mood:${mood}`,
      label: mood,
      icon: meta.icon,
      color: meta.color,
      songs: list,
    });
  }

  // Add genre groups (if not trivial)
  for (const [genre, list] of genreMap.entries()) {
    if (genre === 'Unknown') continue;
    categories.push({
      key: `genre:${genre}`,
      label: genre,
      icon: 'music-circle-outline',
      color: ['#475569', '#334155'],
      songs: list,
    });
  }

  return categories.sort((a, b) => b.songs.length - a.songs.length);
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'songs', label: 'Songs', icon: 'music-note' },
  { key: 'albums', label: 'Albums', icon: 'album' },
  { key: 'artists', label: 'Artists', icon: 'account-music' },
  { key: 'categories', label: 'Categories', icon: 'tag-multiple' },
];

function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBarScroll}
      contentContainerStyle={styles.tabBarContent}>
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Pressable key={t.key} style={styles.tabItem} onPress={() => onChange(t.key)}>
            <MaterialCommunityIcons
              name={t.icon}
              size={16}
              color={isActive ? Colors.accent1 : Colors.textMuted}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {t.label}
            </Text>
            {isActive && <View style={styles.tabUnderline} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Artist Row ───────────────────────────────────────────────────────────────
function ArtistRow({
  artist,
  songs,
  onPress,
}: {
  artist: Artist;
  songs: Song[];
  onPress: () => void;
}) {
  const artSong = songs.find((s) => s.id === artist.songIds[0] && s.albumArt);
  return (
    <Pressable style={styles.artistRow} onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}>
      {artSong?.albumArt ? (
        <Image
          source={toImageSource(artSong.albumArt)}
          style={styles.artistAvatar}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient colors={['#1e1e3a', '#12122a']} style={styles.artistAvatar}>
          <MaterialCommunityIcons name="account-music" size={26} color={Colors.accent1} />
        </LinearGradient>
      )}
      <View style={styles.artistMeta}>
        <Text style={styles.artistName}>{artist.name}</Text>
        <Text style={styles.artistSub}>
          {artist.songIds.length} {artist.songIds.length === 1 ? 'track' : 'tracks'}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
    </Pressable>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  onPress,
  cardWidth,
}: {
  cat: CategoryGroup;
  onPress: () => void;
  cardWidth: number;
}) {
  return (
    <Pressable
      style={[styles.catCard, { width: cardWidth }]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.07)' }}>
      <LinearGradient colors={cat.color as any} style={styles.catGradient}>
        <MaterialCommunityIcons name={cat.icon} size={32} color="#fff" />
        <Text style={styles.catLabel}>{cat.label}</Text>
        <Text style={styles.catCount}>{cat.songs.length} tracks</Text>
      </LinearGradient>
    </Pressable>
  );
}

// ─── Main MusicTab ────────────────────────────────────────────────────────────
export function MusicTab(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { width: W } = useWindowDimensions();

  const songs = useLibraryStore((s) => s.songs);
  const addRecent = useLibraryStore((s) => s.addRecentlyPlayed);
  const scanLibrary = useLibraryStore((s) => s.scanLibrary);
  const favoriteIds = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const togglePrivateId = useLibraryStore((s) => s.togglePrivateId);
  const addQueue = usePlayerStore((s) => s.addToQueue);
  const playSong = usePlayerStore((s) => s.playSong);
  const current = usePlayerStore((s) => s.currentSong);
  const playing = usePlayerStore((s) => s.isPlaying);

  const [activeTab, setActiveTab] = useState<Tab>('songs');
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [btOpen, setBtOpen] = useState(false);

  const { devices, refresh } = useBluetoothPoll();
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  // ── Songs ──
  const visibleSongs = useMemo(
    () => songs.filter((s) => !privateIds.includes(s.id)),
    [songs, privateIds],
  );
  const filteredSongs = useMemo(() => {
    const base = sortSongs(visibleSongs, 'az');
    if (!q.trim()) return base;
    const t = q.toLowerCase();
    return base.filter(
      (s) =>
        s.title.toLowerCase().includes(t) ||
        s.artist.toLowerCase().includes(t) ||
        s.album.toLowerCase().includes(t),
    );
  }, [visibleSongs, q]);

  // ── Albums ──
  const albums = useMemo(() => getAlbumsFromSongs(visibleSongs), [visibleSongs]);
  const filteredAlbums = useMemo(() => {
    if (!q.trim()) return albums;
    const t = q.toLowerCase();
    return albums.filter(
      (a) => a.name.toLowerCase().includes(t) || a.artist.toLowerCase().includes(t),
    );
  }, [albums, q]);

  // ── Artists ──
  const artists = useMemo(() => getArtistsFromSongs(visibleSongs), [visibleSongs]);
  const filteredArtists = useMemo(() => {
    if (!q.trim()) return artists;
    const t = q.toLowerCase();
    return artists.filter((a) => a.name.toLowerCase().includes(t));
  }, [artists, q]);

  // ── Categories ──
  const categories = useMemo(() => buildCategories(visibleSongs), [visibleSongs]);
  const filteredCategories = useMemo(() => {
    if (!q.trim()) return categories;
    const t = q.toLowerCase();
    return categories.filter((c) => c.label.toLowerCase().includes(t));
  }, [categories, q]);

  const handleLongPress = useCallback(
    (song: Song) => {
      Alert.alert('Move to Vault', `Move "${song.title}" to Private Vault?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Move', onPress: () => togglePrivateId(song.id) },
      ]);
    },
    [togglePrivateId],
  );

  const renderSong = useCallback(
    ({ item }: { item: Song }) => (
      <SongRow
        song={item}
        active={current?.id === item.id}
        playing={playing}
        onPress={() => {
          playSong(item, filteredSongs);
          addRecent(item.id);
          navigation.navigate('NowPlaying');
        }}
        onLongPress={() => handleLongPress(item)}
        onAddQueue={() => addQueue(item)}
        rightAction={{
          icon: favoriteSet.has(item.id) ? 'heart' : 'heart-outline',
          backgroundColor: favoriteSet.has(item.id) ? Colors.danger : Colors.accent1,
          onPress: () => toggleFavorite(item.id),
        }}
      />
    ),
    [
      current?.id,
      playing,
      playSong,
      filteredSongs,
      addRecent,
      navigation,
      addQueue,
      favoriteSet,
      toggleFavorite,
      handleLongPress,
    ],
  );

  const renderAlbum = useCallback(
    ({ item }: { item: Album }) => (
      <AlbumCard
        album={item}
        onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id })}
      />
    ),
    [navigation],
  );

  const ALBUM_COL = 2;
  const CAT_COL = 2;
  const CAT_CARD_W = (W - 16 * 3) / CAT_COL;

  // ── Search bar (shared across tabs) ──
  const searchBar = searchOpen ? (
    <View style={styles.searchBox}>
      <MaterialCommunityIcons name="magnify" size={18} color={Colors.textMuted} />
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={`Search ${activeTab}...`}
        placeholderTextColor={Colors.textMuted}
        style={styles.searchInput}
        autoFocus
      />
      {q.length > 0 && (
        <Pressable onPress={() => setQ('')}>
          <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
        </Pressable>
      )}
    </View>
  ) : null;



  return (
    <View style={styles.root}>
      <MusicHeader
        devices={devices}
        onBtPress={() => setBtOpen(true)}
        onSearchPress={() => setSearchOpen((v) => !v)}
        onRefreshPress={() => scanLibrary()}
      />

      <TabBar active={activeTab} onChange={(t) => { setActiveTab(t); setQ(''); }} />

      {searchBar}

      {/* ── SONGS ── */}
      {activeTab === 'songs' && (
        <FlashList
          data={filteredSongs}
          estimatedItemSize={68}
          keyExtractor={(item) => item.id}
          renderItem={renderSong}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* ── ALBUMS ── */}
      {activeTab === 'albums' && (
        <FlashList
          data={filteredAlbums}
          numColumns={ALBUM_COL}
          estimatedItemSize={180}
          keyExtractor={(a) => a.id}
          renderItem={renderAlbum}
          contentContainerStyle={styles.gridContent}
        />
      )}

      {/* ── ARTISTS ── */}
      {activeTab === 'artists' && (
        <FlashList
          data={filteredArtists}
          estimatedItemSize={72}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ArtistRow
              artist={item}
              songs={visibleSongs}
              onPress={() =>
                navigation.navigate('ArtistDetail', { artistId: item.id })
              }
            />
          )}
        />
      )}

      {/* ── CATEGORIES ── */}
      {activeTab === 'categories' && (
        <FlashList
          data={filteredCategories}
          numColumns={CAT_COL}
          estimatedItemSize={130}
          keyExtractor={(c) => c.key}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <View style={styles.catWrapper}>
              <CategoryCard
                cat={item}
                cardWidth={CAT_CARD_W}
                onPress={() => {
                  if (item.songs.length > 0) {
                    playSong(item.songs[0], item.songs);
                    navigation.navigate('NowPlaying');
                  }
                }}
              />
            </View>
          )}
        />
      )}

      <BluetoothSheet
        visible={btOpen}
        onClose={() => setBtOpen(false)}
        devices={devices}
        onRefresh={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // ── Tab bar ──
  tabBarScroll: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    flexGrow: 0,
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 6,
    position: 'relative',
  },
  tabLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: Colors.accent1,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 2,
    backgroundColor: Colors.accent1,
  },

  // ── Search ──
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  countRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  countText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  listContent: { paddingBottom: 180 },
  gridContent: { paddingHorizontal: 8, paddingBottom: 180, paddingTop: 4 },

  // ── Artist ──
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.glassBorder,
    gap: 12,
  },
  artistAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  artistMeta: { flex: 1 },
  artistName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  artistSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },

  // ── Category ──
  catWrapper: { flex: 1, padding: 6 },
  catCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  catGradient: {
    padding: 20,
    minHeight: 120,
    justifyContent: 'flex-end',
    gap: 4,
  },
  catLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  catCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
});
