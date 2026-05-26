import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SongRow } from '../../components/library/SongRow';
import { MediaActionSheet } from '../../components/common/MediaActionSheet';
import { Colors } from '../../theme/colors';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import type { Song, Video } from '../../types';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { styles } from '../../styles/screens/shared/PlaylistStyles';
import { useBottomPadding } from '../../hooks/useBottomPadding';


type Nav = NativeStackNavigationProp<MusicStackParamList>;
type R = RouteProp<MusicStackParamList, 'Playlist'>;

export function PlaylistScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const bottomPadding = useBottomPadding();
  const playlists = useLibraryStore((s) => s.playlists);
  const songs = useLibraryStore((s) => s.songs);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const [selectedMedia, setSelectedMedia] = React.useState<{
    item: Song | Video;
    type: 'song' | 'video';
  } | null>(null);
  const pl = useMemo(
    () => playlists.find((p) => p.id === route.params.playlistId),
    [playlists, route.params.playlistId],
  );
  const list = useMemo(() => {
    if (!pl) {
      return [];
    }
    return pl.songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is Song => s !== undefined)
      .filter((s) => !privateIds.includes(s.id));
  }, [pl, songs, privateIds]);
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
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text numberOfLines={1} style={styles.headerTitle}>{pl.name}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <FlashList showsVerticalScrollIndicator={false}
        data={list}
        estimatedItemSize={64}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
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
            onLongPress={() => setSelectedMedia({ item, type: 'song' })}
            onAddQueue={() => addQueue(item)}
            rightAction={{
              icon: 'playlist-remove',
              backgroundColor: Colors.danger,
              onPress: () => removeFromPlaylist(pl.id, item.id),
            }}
          />
        )}
      />
      <MediaActionSheet
        visible={selectedMedia !== null}
        item={selectedMedia?.item ?? null}
        type={selectedMedia?.type ?? null}
        onClose={() => setSelectedMedia(null)}
      />
    </View>
  );
}



