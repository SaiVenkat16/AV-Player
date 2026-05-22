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
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';

type Nav = NativeStackNavigationProp<MusicStackParamList>;
type R = RouteProp<MusicStackParamList, 'Playlist'>;

export function PlaylistScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const playlists = useLibraryStore((s) => s.playlists);
  const songs = useLibraryStore((s) => s.songs);
  const pl = useMemo(
    () => playlists.find((p) => p.id === route.params.playlistId),
    [playlists, route.params.playlistId],
  );
  const list = useMemo(() => {
    if (!pl) {
      return [];
    }
    return pl.songIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as typeof songs;
  }, [pl, songs]);
  const playSong = usePlayerStore((s) => s.playSong);
  const current = usePlayerStore((s) => s.currentSong);
  const playing = usePlayerStore((s) => s.isPlaying);
  const addQueue = usePlayerStore((s) => s.addToQueue);
  const addRecent = useLibraryStore((s) => s.addRecentlyPlayed);
  const removeFromPlaylist = useLibraryStore((s) => s.removeFromPlaylist);
  if (!pl) {
    return (
      <View style={styles.center}>
        <Text style={styles.missingText}>Playlist missing</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={[Typography.subtitle, styles.backButtonText]}>‹ Back</Text>
      </Pressable>
      <Text style={[Typography.hero, styles.title]}>{pl.name}</Text>
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
              icon: 'playlist-remove',
              backgroundColor: Colors.danger,
              onPress: () => removeFromPlaylist(pl.id, item.id),
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
  missingText: { color: Colors.textSecondary },
  backText: { color: Colors.accent2 },
  backButton: { padding: 16 },
  backButtonText: { color: Colors.accent2 },
  title: { color: Colors.textPrimary, marginLeft: 16 },
});
