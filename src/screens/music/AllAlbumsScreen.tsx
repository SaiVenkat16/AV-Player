import React, { useMemo } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import { useLibraryStore, getAlbumsFromSongs } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { toImageSource } from '../../utils/mediaUri';

const SCREEN_W = Dimensions.get('window').width;
const ITEM_W = (SCREEN_W - 24 - 16) / 3;

type Nav = NativeStackNavigationProp<MusicStackParamList>;

export function AllAlbumsScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const songs = useLibraryStore((s) => s.songs);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const playSong = usePlayerStore((s) => s.playSong);
  const addRecent = useLibraryStore((s) => s.addRecentlyPlayed);

  const visibleSongs = useMemo(() => songs.filter((s) => !privateIds.includes(s.id)), [songs, privateIds]);
  const albums = useMemo(() => getAlbumsFromSongs(visibleSongs), [visibleSongs]);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.textPrimary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Albums</Text>
        </View>
        <View style={s.backBtn} />
      </View>

      <FlashList
        data={albums}
        numColumns={3}
        estimatedItemSize={150}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <View style={s.gridItem}>
            <Pressable onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id })}>
              <View style={s.artWrap}>
                {item.artUri ? (
                  <Image source={toImageSource(item.artUri)} style={s.art} />
                ) : (
                  <View style={[s.art, s.artPlaceholder]}>
                    <MaterialCommunityIcons name="album" size={40} color={Colors.textMuted} />
                  </View>
                )}
                <Pressable
                  style={s.playBtn}
                  onPress={() => {
                    const albumSongs = visibleSongs.filter((song) => item.songIds.includes(song.id));
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
              <Text numberOfLines={1} style={s.name}>{item.name}</Text>
              <Text numberOfLines={1} style={s.sub}>{item.songIds.length} tracks</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingHorizontal: 12 },
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
  headerSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  gridItem: {
    width: ITEM_W,
    marginHorizontal: 4,
    marginTop: 12,
  },
  artWrap: { position: 'relative' },
  art: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  artPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  playBtn: {
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
  name: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 4,
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
});

