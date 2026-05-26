import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { styles } from '../../styles/screens/video/VideoFolderStyles';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import type { VideoStackParamList } from '../../navigation/VideoStack';
import { useLibraryStore } from '../../store/libraryStore';
import { useVideoPlayerStore } from '../../store/videoPlayerStore';
import type { Song, Video } from '../../types';
import { VideoListItem } from '../../components/video/VideoListItem';
import { MediaActionSheet } from '../../components/common/MediaActionSheet';
import { useBottomPadding } from '../../hooks/useBottomPadding';

type Nav = NativeStackNavigationProp<VideoStackParamList>;
type R = RouteProp<VideoStackParamList, 'VideoFolderDetail'>;

export function VideoFolderScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { folderPath, folderName } = route.params;
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding(true);

  const videos = useLibraryStore((s) => s.videos);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const ensureThumb = useLibraryStore((s) => s.ensureVideoThumbnail);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortMode, setSortMode] = useState<'name' | 'size' | 'duration'>('name');
  const [selectedMedia, setSelectedMedia] = useState<{
    item: Song | Video;
    type: 'song' | 'video';
  } | null>(null);

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
      setSelectedMedia({ item: video, type: 'video' });
    },
    [],
  );

  const handleOpen = useCallback(
    (video: Video) => {
      useVideoPlayerStore.getState().openVideo(video.id);
    },
    [],
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
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text numberOfLines={1} style={styles.headerTitle}>{folderName}</Text>
          <Text style={styles.headerSub}>{filtered.length} videos</Text>
        </View>
        <Pressable style={styles.backBtn} onPress={() => setSearchOpen((v) => !v)} hitSlop={12}>
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
            <Pressable onPress={() => setSearchQuery('')} hitSlop={12}>
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
            onPress={() => setSortMode(opt.key)}
            hitSlop={8}>
            <Text style={[styles.chipText, sortMode === opt.key && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Video list */}
      <FlashList showsVerticalScrollIndicator={false}
        data={filtered}
        estimatedItemSize={88}
        keyExtractor={(v) => v.id}
        contentContainerStyle={StyleSheet.flatten([styles.listContent, { paddingBottom: bottomPadding }])}
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
      <MediaActionSheet
        visible={selectedMedia !== null}
        item={selectedMedia?.item ?? null}
        type={selectedMedia?.type ?? null}
        onClose={() => setSelectedMedia(null)}
      />
    </View>
  );
}

