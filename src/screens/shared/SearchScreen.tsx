import React, { useMemo, useState } from 'react';
import { TextInput, View, Pressable, Text, ScrollView, FlatList, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SongRow } from '../../components/library/SongRow';
import { VideoCard } from '../../components/library/VideoCard';
import { MediaActionSheet } from '../../components/common/MediaActionSheet';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import type { VideoStackParamList } from '../../navigation/VideoStack';
import type { Song, Video } from '../../types';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { useVideoPlayerStore } from '../../store/videoPlayerStore';
import { styles } from '../../styles/screens/shared/SearchStyles';
import { useBottomPadding } from '../../hooks/useBottomPadding';

type Nav = NativeStackNavigationProp<MusicStackParamList & VideoStackParamList>;
type R = RouteProp<MusicStackParamList & VideoStackParamList, 'Search'>;

type SearchTab = 'all' | 'audios' | 'videos';

export function SearchScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const bottomPadding = useBottomPadding();
  
  const songs = useLibraryStore((s) => s.songs);
  const videos = useLibraryStore((s) => s.videos);
  const privateIds = useLibraryStore((s) => s.privateIds);
  
  const playSong = usePlayerStore((s) => s.playSong);
  const current = usePlayerStore((s) => s.currentSong);
  const playing = usePlayerStore((s) => s.isPlaying);
  const addQueue = usePlayerStore((s) => s.addToQueue);
  
  const addRecent = useLibraryStore((s) => s.addRecentlyPlayed);
  const favoriteIds = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const [q, setQ] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{
    item: Song | Video;
    type: 'song' | 'video';
  } | null>(null);
  
  // Set initial search tab depending on what screen they came from
  const [activeTab, setActiveTab] = useState<SearchTab>(
    route.params.mode === 'video' ? 'videos' : 'audios'
  );

  const filteredSongs = useMemo(() => {
    const t = q.trim().toLowerCase();
    const visibleSongs = songs.filter((s) => !privateIds.includes(s.id));
    if (!t) return visibleSongs;
    return visibleSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(t) ||
        s.artist.toLowerCase().includes(t) ||
        s.album.toLowerCase().includes(t),
    );
  }, [songs, privateIds, q]);

  const filteredVideos = useMemo(() => {
    const t = q.trim().toLowerCase();
    const visibleVideos = videos.filter((v) => !privateIds.includes(v.id));
    if (!t) return visibleVideos;
    return visibleVideos.filter((v) => v.title.toLowerCase().includes(t));
  }, [videos, privateIds, q]);

  const hasResults = filteredSongs.length > 0 || filteredVideos.length > 0;

  const handlePlayVideo = (videoId: string) => {
    useVideoPlayerStore.getState().openVideo(videoId);
  };

  const handlePlaySong = (song: typeof songs[0], playlist: typeof songs) => {
    playSong(song, playlist);
    addRecent(song.id);
    (navigation as any).navigate('Music', {
      screen: 'NowPlaying',
    });
  };

  return (
    <View style={styles.root}>
      {/* Top Search Input Row with Back button */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.inputWrapper}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={
              activeTab === 'all'
                ? 'Search audios & videos...'
                : activeTab === 'videos'
                ? 'Search videos...'
                : 'Search audios...'
            }
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            autoFocus={true}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Segmented Tab Selector */}
      <View style={styles.tabContainer}>
        {(['all', 'audios', 'videos'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'all' ? 'All' : tab === 'videos' ? 'Videos' : 'Audios'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Results view depending on selected tab */}
      {!hasResults && q.trim().length > 0 ? (
        <View style={styles.emptyView}>
          <MaterialCommunityIcons name="magnify-close" size={48} color={Colors.textMuted} />
          <Text style={[Typography.body, styles.emptyText]}>
            No results found for "{q}"
          </Text>
        </View>
      ) : activeTab === 'all' ? (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
          {/* Videos Section */}
          {filteredVideos.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Videos ({filteredVideos.length})</Text>
                <Pressable onPress={() => setActiveTab('videos')}>
                  <Text style={styles.sectionLink}>See All</Text>
                </Pressable>
              </View>
              <FlatList
                horizontal
                data={filteredVideos.slice(0, 5)}
                keyExtractor={(v) => v.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
                renderItem={({ item }) => (
                  <View style={styles.horizontalVideoCard}>
                    <VideoCard
                      item={item}
                      onOpen={() => handlePlayVideo(item.id)}
                      onLongMenu={() => setSelectedMedia({ item, type: 'video' })}
                    />
                  </View>
                )}
              />
            </View>
          )}

          {/* Audios Section */}
          {filteredSongs.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Audios ({filteredSongs.length})</Text>
                <Pressable onPress={() => setActiveTab('audios')}>
                  <Text style={styles.sectionLink}>See All</Text>
                </Pressable>
              </View>
              <View style={styles.audiosListWrapper}>
                {filteredSongs.slice(0, 10).map((item) => (
                  <SongRow
                    key={item.id}
                    song={item}
                    active={current?.id === item.id}
                    playing={playing}
                    onPress={() => handlePlaySong(item, filteredSongs)}
                    onLongPress={() => setSelectedMedia({ item, type: 'song' })}
                    onAddQueue={() => addQueue(item)}
                    rightAction={{
                      icon: favoriteSet.has(item.id) ? 'heart' : 'heart-outline',
                      backgroundColor: favoriteSet.has(item.id) ? Colors.danger : Colors.accent1,
                      onPress: () => toggleFavorite(item.id),
                    }}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : activeTab === 'videos' ? (
        <FlashList showsVerticalScrollIndicator={false}
          data={filteredVideos}
          numColumns={2}
          estimatedItemSize={220}
          keyExtractor={(v) => v.id}
          contentContainerStyle={StyleSheet.flatten([styles.gridContent, { paddingBottom: bottomPadding }])}
          renderItem={({ item }) => (
            <View style={styles.videoCardWrapper}>
              <VideoCard
                item={item}
                onOpen={() => handlePlayVideo(item.id)}
                onLongMenu={() => setSelectedMedia({ item, type: 'video' })}
              />
            </View>
          )}
        />
      ) : (
        <FlashList showsVerticalScrollIndicator={false}
          data={filteredSongs}
          estimatedItemSize={64}
          keyExtractor={(s) => s.id}
          contentContainerStyle={StyleSheet.flatten([styles.audioListContent, { paddingBottom: bottomPadding }])}
          renderItem={({ item }) => (
            <SongRow
              song={item}
              active={current?.id === item.id}
              playing={playing}
              onPress={() => handlePlaySong(item, filteredSongs)}
              onLongPress={() => setSelectedMedia({ item, type: 'song' })}
              onAddQueue={() => addQueue(item)}
              rightAction={{
                icon: favoriteSet.has(item.id) ? 'heart' : 'heart-outline',
                backgroundColor: favoriteSet.has(item.id) ? Colors.danger : Colors.accent1,
                onPress: () => toggleFavorite(item.id),
              }}
            />
          )}
        />
      )}
      <MediaActionSheet
        visible={selectedMedia !== null}
        item={selectedMedia?.item ?? null}
        type={selectedMedia?.type ?? null}
        onClose={() => setSelectedMedia(null)}
      />
    </View>
  );
}

