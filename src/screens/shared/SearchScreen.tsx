import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SongRow } from '../../components/library/SongRow';
import { VideoCard } from '../../components/library/VideoCard';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import type { VideoStackParamList } from '../../navigation/VideoStack';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';

type Nav = NativeStackNavigationProp<MusicStackParamList & VideoStackParamList>;
type R = RouteProp<MusicStackParamList & VideoStackParamList, 'Search'>;

export function SearchScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const songs = useLibraryStore((s) => s.songs);
  const videos = useLibraryStore((s) => s.videos);
  const [q, setQ] = useState('');
  const playSong = usePlayerStore((s) => s.playSong);
  const current = usePlayerStore((s) => s.currentSong);
  const playing = usePlayerStore((s) => s.isPlaying);
  const addQueue = usePlayerStore((s) => s.addToQueue);
  const addRecent = useLibraryStore((s) => s.addRecentlyPlayed);
  const favoriteIds = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const filteredSongs = useMemo(() => {
    const t = q.toLowerCase();
    if (!t) {
      return songs;
    }
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(t) ||
        s.artist.toLowerCase().includes(t) ||
        s.album.toLowerCase().includes(t),
    );
  }, [songs, q]);
  const filteredVideos = useMemo(() => {
    const t = q.toLowerCase();
    if (!t) {
      return videos;
    }
    return videos.filter((v) => v.title.toLowerCase().includes(t));
  }, [videos, q]);
  if (route.params.mode === 'video') {
    return (
      <View style={styles.root}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search videos"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />
        <FlashList
          data={filteredVideos}
          numColumns={2}
          estimatedItemSize={220}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => (
            <VideoCard
              item={item}
              onOpen={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
              onLongMenu={() => {}}
            />
          )}
        />
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search music"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
      />
      <FlashList
        data={filteredSongs}
        estimatedItemSize={64}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <SongRow
            song={item}
            active={current?.id === item.id}
            playing={playing}
            onPress={() => {
              playSong(item, filteredSongs);
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
  root: { flex: 1, backgroundColor: Colors.background, paddingTop: 12 },
  input: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    color: Colors.textPrimary,
    ...Typography.body,
  },
});
