import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SongRow } from '../../components/library/SongRow';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import { useLibraryStore, getAlbumsFromSongs } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';

type Nav = NativeStackNavigationProp<MusicStackParamList>;
type R = RouteProp<MusicStackParamList, 'AlbumDetail'>;

export function AlbumDetailScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const songs = useLibraryStore((s) => s.songs);
  const album = useMemo(
    () => getAlbumsFromSongs(songs).find((a) => a.id === route.params.albumId),
    [songs, route.params.albumId],
  );
  const list = useMemo(
    () => (album ? songs.filter((s) => album.songIds.includes(s.id)) : []),
    [album, songs],
  );
  const playSong = usePlayerStore((s) => s.playSong);
  const current = usePlayerStore((s) => s.currentSong);
  const playing = usePlayerStore((s) => s.isPlaying);
  const addQueue = usePlayerStore((s) => s.addToQueue);
  const addRecent = useLibraryStore((s) => s.addRecentlyPlayed);
  const favoriteIds = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  if (!album) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Album not found</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Back</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={[Typography.subtitle, styles.backButtonText]}>‹ Back</Text>
      </Pressable>
      <Text style={[Typography.hero, styles.t]}>{album.name}</Text>
      <Text style={[Typography.body, styles.artistName]}>{album.artist}</Text>
      <FlashList
        data={list}
        estimatedItemSize={64}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <SongRow
            song={item}
            active={current?.id === item.id}
            playing={playing}
            onPress={() => {
              playSong(item, list);
              addRecent(item.id);
              navigation.navigate('NowPlaying');
            }}
            onAddQueue={() => addQueue(item)}
            rightAction={{
              icon: favoriteSet.has(item.id) ? 'heart' : 'heart-outline',
              backgroundColor: favoriteSet.has(item.id) ? Colors.danger : Colors.accent1,
              onPress: () => toggleFavorite(item.id),
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  t: { color: Colors.textPrimary, marginLeft: 16, marginTop: 8 },
  notFoundText: { color: Colors.textSecondary },
  backLinkText: { color: Colors.accent2, marginTop: 12 },
  backButton: { padding: 16 },
  backButtonText: { color: Colors.accent2 },
  artistName: { color: Colors.textMuted, marginLeft: 16 },
});
