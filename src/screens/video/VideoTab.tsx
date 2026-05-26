import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { styles } from '../../styles/screens/video/VideoTabStyles';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import type { VideoStackParamList } from '../../navigation/VideoStack';
import { useLibraryStore } from '../../store/libraryStore';
import type { Video } from '../../types';
import { FolderCard, type VideoFolder } from '../../components/video/FolderCard';
import { useBottomPadding } from '../../hooks/useBottomPadding';
import { useSearchStore } from '../../store/searchStore';
import { HomeHeader } from '../../components/layout/HomeHeader';

type Nav = NativeStackNavigationProp<VideoStackParamList>;

function groupVideosByFolder(videos: Video[]): VideoFolder[] {
  const map = new Map<string, VideoFolder>();
  for (const v of videos) {
    const parts = v.path.replace(/\\/g, '/').split('/');
    const folderPath = parts.slice(0, -1).join('/');
    const folderName = parts[parts.length - 2] || 'Storage';
    if (!map.has(folderPath)) {
      map.set(folderPath, {
        folderPath,
        folderName,
        videos: [],
        coverUri: null,
      });
    }
    const folder = map.get(folderPath)!;
    folder.videos.push(v);
    // Use first available thumbnail as cover
    if (!folder.coverUri && v.thumbnailUri) {
      folder.coverUri = v.thumbnailUri;
    }
  }
  return [...map.values()].sort((a, b) =>
    a.folderName.localeCompare(b.folderName)
  );
}

export function VideoTab(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const videos = useLibraryStore((s) => s.videos);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const scanLibrary = useLibraryStore((s) => s.scanLibrary);
  const { width: W } = useWindowDimensions();
  const bottomPadding = useBottomPadding();

  const CARD_WIDTH = (W - 48) / 2;

  const visibleVideos = useMemo(
    () => videos.filter((v) => !privateIds.includes(v.id)),
    [videos, privateIds],
  );

  const searchQuery = useSearchStore((s) => s.query);
  const isSearchOpen = useSearchStore((s) => s.isSearchOpen);

  const filteredVideos = useMemo(() => {
    if (isSearchOpen && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return visibleVideos.filter((v) => v.title.toLowerCase().includes(q));
    }
    return visibleVideos;
  }, [visibleVideos, isSearchOpen, searchQuery]);

  const folders = useMemo(
    () => groupVideosByFolder(filteredVideos),
    [filteredVideos],
  );

  return (
    <View style={styles.root}>
      <HomeHeader mode="video" />
      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {folders.length} folders · {filteredVideos.length} videos
        </Text>
        <Pressable onPress={() => scanLibrary()} hitSlop={12}>
          <MaterialCommunityIcons
            name="refresh"
            size={18}
            color={Colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* Folder grid */}
      <FlashList showsVerticalScrollIndicator={false}
        data={folders}
        numColumns={2}
        estimatedItemSize={220}
        keyExtractor={(f) => f.folderPath}
        contentContainerStyle={StyleSheet.flatten([styles.listContent, { paddingBottom: bottomPadding }])}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="video-off-outline"
              size={56}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyText}>No videos found</Text>
            <Pressable style={styles.emptyBtn} onPress={() => scanLibrary()}>
              <Text style={styles.emptyBtnText}>Scan Library</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <FolderCard
              folder={item}
              cardWidth={CARD_WIDTH}
              onPress={() =>
                navigation.navigate('VideoFolderDetail', {
                  folderPath: item.folderPath,
                  folderName: item.folderName,
                })
              }
            />
          </View>
        )}
      />
    </View>
  );
}

