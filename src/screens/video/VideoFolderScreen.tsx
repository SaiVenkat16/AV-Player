import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import type { VideoStackParamList } from '../../navigation/VideoStack';
import { useLibraryStore } from '../../store/libraryStore';
import type { Video } from '../../types';
import { toImageSource } from '../../utils/mediaUri';
import { formatTime } from '../../utils/formatTime';

type Nav = NativeStackNavigationProp<VideoStackParamList>;
type R = RouteProp<VideoStackParamList, 'VideoFolderDetail'>;

function formatSize(bytes: number): string {
  if (bytes === 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function VideoListItem({
  item,
  onPress,
  onLongPress,
}: {
  item: Video;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      style={styles.videoItem}
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: 'rgba(255,255,255,0.07)' }}>
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {item.thumbnailUri ? (
          <Image
            source={toImageSource(item.thumbnailUri)}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient colors={['#1a1a35', '#0d0d1f']} style={styles.thumb}>
            <MaterialCommunityIcons name="play-circle-outline" size={28} color={Colors.accent1} />
          </LinearGradient>
        )}
        {/* Duration badge */}
        {item.duration > 0 && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatTime(item.duration)}</Text>
          </View>
        )}
        {/* Resolution badge */}
        {item.width > 0 && item.height > 0 && (
          <View style={styles.resBadge}>
            <Text style={styles.resText}>
              {item.width >= 3840 ? '4K' : item.width >= 1920 ? 'FHD' : item.width >= 1280 ? 'HD' : 'SD'}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.videoMeta}>
        <Text numberOfLines={2} style={styles.videoTitle}>{item.title}</Text>
        <View style={styles.videoSubRow}>
          {item.duration > 0 && (
            <Text style={styles.videoSub}>{formatTime(item.duration)}</Text>
          )}
          {item.sizeBytes > 0 && (
            <Text style={styles.videoSub}> · {formatSize(item.sizeBytes)}</Text>
          )}
          {item.width > 0 && item.height > 0 && (
            <Text style={styles.videoSub}> · {item.width}×{item.height}</Text>
          )}
        </View>
      </View>

      {/* Play chevron */}
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={Colors.textMuted}
      />
    </Pressable>
  );
}

export function VideoFolderScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { folderPath, folderName } = route.params;
  const insets = useSafeAreaInsets();

  const videos = useLibraryStore((s) => s.videos);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const togglePrivateId = useLibraryStore((s) => s.togglePrivateId);
  const ensureThumb = useLibraryStore((s) => s.ensureVideoThumbnail);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortMode, setSortMode] = useState<'name' | 'size' | 'duration'>('name');

  const folderVideos = useMemo(() => {
    return videos.filter(
      (v) =>
        !privateIds.includes(v.id) &&
        v.path.replace(/\\/g, '/').startsWith(folderPath),
    );
  }, [videos, privateIds, folderPath]);

  // Generate thumbnails for first 10 videos when folder opens (batched, 2 at a time)
  useEffect(() => {
    const toGenerate = folderVideos
      .filter((v) => !v.thumbnailUri)
      .slice(0, 10);
    if (toGenerate.length === 0) return;

    let cancelled = false;
    (async () => {
      for (let i = 0; i < toGenerate.length; i += 2) {
        if (cancelled) break;
        const batch = toGenerate.slice(i, i + 2);
        await Promise.allSettled(batch.map((v) => ensureThumb(v.id)));
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderPath]);

  const filtered = useMemo(() => {
    let list = folderVideos;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q));
    }
    switch (sortMode) {
      case 'size':
        return [...list].sort((a, b) => b.sizeBytes - a.sizeBytes);
      case 'duration':
        return [...list].sort((a, b) => b.duration - a.duration);
      default:
        return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [folderVideos, searchQuery, sortMode]);

  const handleLongPress = useCallback(
    (video: Video) => {
      Alert.alert(
        video.title,
        'Choose action',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Move to Private Vault',
            onPress: () => togglePrivateId(video.id),
          },
        ],
      );
    },
    [togglePrivateId],
  );

  const handleOpen = useCallback(
    (video: Video) => {
      navigation.navigate('VideoPlayer', { videoId: video.id });
    },
    [navigation],
  );

  const SORT_OPTS: { key: typeof sortMode; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'size', label: 'Size' },
    { key: 'duration', label: 'Duration' },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text numberOfLines={1} style={styles.headerTitle}>{folderName}</Text>
          <Text style={styles.headerSub}>{filtered.length} videos</Text>
        </View>
        <Pressable style={styles.backBtn} onPress={() => setSearchOpen((v) => !v)}>
          <MaterialCommunityIcons
            name={searchOpen ? 'close' : 'magnify'}
            size={22}
            color={Colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* Search */}
      {searchOpen && (
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search in folder..."
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

      {/* Sort chips */}
      <View style={styles.sortRow}>
        {SORT_OPTS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.chip, sortMode === opt.key && styles.chipActive]}
            onPress={() => setSortMode(opt.key)}>
            <Text style={[styles.chipText, sortMode === opt.key && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Video list */}
      <FlashList
        data={filtered}
        estimatedItemSize={88}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="video-off-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No videos found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <VideoListItem
            item={item}
            onPress={() => handleOpen(item)}
            onLongPress={() => handleLongPress(item)}
          />
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
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1, paddingHorizontal: 8 },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
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
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  chipActive: {
    backgroundColor: Colors.accent1,
    borderColor: Colors.accent1,
  },
  chipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  listContent: { paddingBottom: 120 },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.glassBorder,
  },
  thumbWrap: {
    width: 120,
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  thumb: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  durationText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  resBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(168,85,247,0.8)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  resText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  videoMeta: { flex: 1 },
  videoTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  videoSubRow: { flexDirection: 'row', marginTop: 4 },
  videoSub: { color: Colors.textMuted, fontSize: 11 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },
});
