import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { GradientText } from '../../components/common/GradientText';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { VideoStackParamList } from '../../navigation/VideoStack';
import { useLibraryStore } from '../../store/libraryStore';
import type { Video } from '../../types';
import { toImageSource } from '../../utils/mediaUri';

type Nav = NativeStackNavigationProp<VideoStackParamList>;

export type VideoFolder = {
  folderPath: string;
  folderName: string;
  videos: Video[];
  coverUri: string | null;
};

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

function FolderCard({
  folder,
  onPress,
  cardWidth,
}: {
  folder: VideoFolder;
  onPress: () => void;
  cardWidth: number;
}) {
  return (
    <Pressable
      style={[styles.folderCard, { width: cardWidth }]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>
      <View style={styles.folderThumbWrap}>
        {folder.coverUri ? (
          <Image
            source={toImageSource(folder.coverUri)}
            style={styles.folderThumb}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#1e1e3a', '#12122a']}
            style={styles.folderThumb}>
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={40}
              color={Colors.accent1}
            />
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.folderGradient}
        />
        {/* Video count badge */}
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{folder.videos.length}</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.folderName}>
        {folder.folderName}
      </Text>
      <Text style={styles.folderSub}>
        {folder.videos.length} {folder.videos.length === 1 ? 'video' : 'videos'}
      </Text>
    </Pressable>
  );
}

export function VideoTab(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const videos = useLibraryStore((s) => s.videos);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const scanLibrary = useLibraryStore((s) => s.scanLibrary);
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const CARD_WIDTH = (W - 48) / 2;

  const visibleVideos = useMemo(
    () => videos.filter((v) => !privateIds.includes(v.id)),
    [videos, privateIds],
  );

  const folders = useMemo(
    () => groupVideosByFolder(visibleVideos),
    [visibleVideos],
  );

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    const q = searchQuery.toLowerCase();
    return folders.filter((f) =>
      f.folderName.toLowerCase().includes(q) ||
      f.videos.some((v) => v.title.toLowerCase().includes(q))
    );
  }, [folders, searchQuery]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.centerAbsolute} pointerEvents="none">
          <GradientText style={Typography.hero}>Videos</GradientText>
        </View>
        <View style={styles.left} />
        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setSearchOpen((v) => !v)}>
            <MaterialCommunityIcons
              name={searchOpen ? 'close' : 'magnify'}
              size={22}
              color={Colors.textPrimary}
            />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => scanLibrary()}>
            <MaterialCommunityIcons
              name="refresh"
              size={22}
              color={Colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      {searchOpen && (
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search folders or videos..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {filteredFolders.length} folders · {visibleVideos.length} videos
        </Text>
      </View>

      {/* Folder grid */}
      <FlashList
        data={filteredFolders}
        numColumns={2}
        estimatedItemSize={220}
        keyExtractor={(f) => f.folderPath}
        contentContainerStyle={styles.listContent}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  centerAbsolute: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  left: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 6 },
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
  statsRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  statsText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  listContent: { paddingBottom: 180, paddingHorizontal: 12, paddingTop: 4 },
  cardWrapper: { flex: 1, margin: 6 },
  folderCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  folderThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderThumb: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderGradient: {
    ...StyleSheet.absoluteFill,
  },
  countBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  countBadgeText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  folderName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 2,
  },
  folderSub: {
    color: Colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: Colors.accent1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
