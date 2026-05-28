import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { styles } from '../../styles/screens/video/VideoTabStyles';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import type { VideoStackParamList } from '../../navigation/VideoStack';
import { useLibraryStore } from '../../store/libraryStore';
import type { Video } from '../../types';
import { FolderCard, type VideoFolder } from '../../components/video/FolderCard';
import { ContinueWatchingRow, type ContinueWatchingItem } from '../../components/video/ContinueWatchingRow';
import { useVideoPlayerStore } from '../../store/videoPlayerStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useBottomPadding } from '../../hooks/useBottomPadding';
import { getVideoFolderIcon } from '../../utils/folderIcon';
import { useSearchStore } from '../../store/searchStore';
import { HomeHeader } from '../../components/layout/HomeHeader';

type Nav = NativeStackNavigationProp<VideoStackParamList>;

function normalizePath(p: string): string {
  return p
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
}

// Known app-root folder names. Any video deep inside one of these
// (e.g. /Telegram/Telegram Video/foo.mp4) rolls up into a single folder card.
const APP_ROOT_FOLDERS = [
  'Telegram',
  'WhatsApp',
  'Instagram',
  'Snapchat',
  'Facebook',
  'TikTok',
];

function getGroupingPath(filePath: string): { folderPath: string; folderName: string; isAppRoot: boolean } {
  const norm = normalizePath(filePath);
  const segments = norm.split('/');
  // Walk segments to find an app-root anywhere in the path
  for (let i = 0; i < segments.length - 1; i += 1) {
    const seg = segments[i];
    const matched = APP_ROOT_FOLDERS.find(
      (app) => seg.toLowerCase() === app.toLowerCase(),
    );
    if (matched) {
      // Use a synthetic key based on the app name so videos from
      // different physical locations (e.g. /Telegram and /Download/Telegram)
      // collapse into the same card.
      return {
        folderPath: `__app__/${matched.toLowerCase()}`,
        folderName: matched,
        isAppRoot: true,
      };
    }
  }
  // Fallback: immediate parent
  const lastSlash = norm.lastIndexOf('/');
  const folderPath = norm.slice(0, lastSlash);
  const folderName = folderPath.slice(folderPath.lastIndexOf('/') + 1) || 'Storage';
  return { folderPath, folderName, isAppRoot: false };
}

function groupVideosByFolder(videos: Video[]): VideoFolder[] {
  const map = new Map<string, VideoFolder>();
  for (const v of videos) {
    const norm = normalizePath(v.path);
    if (!norm.includes('/')) continue;
    const { folderPath, folderName } = getGroupingPath(norm);
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
  const isScanning = useLibraryStore((s) => s.isScanning);
  const videoProgress = useLibraryStore((s) => s.videoProgress);
  const clearVideoProgress = useLibraryStore((s) => s.clearVideoProgress);
  const viewMode = useSettingsStore((s) => s.videoTabViewMode);
  const setViewMode = useSettingsStore((s) => s.setVideoTabViewMode);
  const bottomPadding = useBottomPadding();

  // Re-lock to portrait whenever VideoTab gains focus (e.g. after closing the
  // fullscreen video player). Prevents stale landscape dimensions from a
  // previous play session bleeding into the grid layout.
  useFocusEffect(
    useCallback(() => {
      Orientation.lockToPortrait();
    }, []),
  );

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

  const continueItems = useMemo<ContinueWatchingItem[]>(() => {
    if (isSearchOpen && searchQuery.trim()) {
      return [];
    }
    const items: ContinueWatchingItem[] = [];
    for (const v of visibleVideos) {
      const p = videoProgress[v.id];
      if (p && p.position > 5 && p.duration > 0 && p.position < p.duration - 10) {
        items.push({
          video: v,
          position: p.position,
          duration: p.duration,
          watchedAt: p.watchedAt,
        });
      }
    }
    return items.sort((a, b) => b.watchedAt - a.watchedAt).slice(0, 12);
  }, [visibleVideos, videoProgress, isSearchOpen, searchQuery]);

  const handleOpenContinue = (videoId: string) => {
    useVideoPlayerStore.getState().openVideo(videoId);
  };

  return (
    <View style={styles.root}>
      <HomeHeader mode="video" />
      {/* View toggle */}
      <View style={styles.viewToggleRow}>
        <Pressable
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          style={styles.viewToggleBtn}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name={viewMode === 'grid' ? 'view-grid-outline' : 'format-list-bulleted'}
            size={18}
            color={Colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* Folder grid / list */}
      <FlashList showsVerticalScrollIndicator={false}
        key={viewMode}
        data={folders}
        numColumns={viewMode === 'grid' ? 2 : 1}
        estimatedItemSize={viewMode === 'grid' ? 220 : 78}
        keyExtractor={(f) => f.folderPath}
        contentContainerStyle={StyleSheet.flatten([styles.listContent, { paddingBottom: bottomPadding }])}
        refreshControl={
          <RefreshControl
            refreshing={isScanning}
            onRefresh={() => scanLibrary()}
            tintColor={Colors.accent1}
            colors={[Colors.accent1]}
            progressBackgroundColor={Colors.surface}
          />
        }
        ListHeaderComponent={
          <ContinueWatchingRow
            items={continueItems}
            onOpen={handleOpenContinue}
            onRemove={clearVideoProgress}
          />
        }
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
        renderItem={({ item }) => {
          if (viewMode === 'grid') {
            return (
              <View style={styles.cardWrapper}>
                <FolderCard
                  folder={item}
                  onPress={() =>
                    navigation.navigate('VideoFolderDetail', {
                      folderPath: item.folderPath,
                      folderName: item.folderName,
                    })
                  }
                />
              </View>
            );
          }
          return (
            <Pressable
              style={styles.folderRow}
              onPress={() =>
                navigation.navigate('VideoFolderDetail', {
                  folderPath: item.folderPath,
                  folderName: item.folderName,
                })
              }
              android_ripple={{ color: 'rgba(255,255,255,0.07)' }}
            >
              <View style={styles.folderRowThumb}>
                <MaterialCommunityIcons
                  name="folder"
                  size={56}
                  color={Colors.textMuted}
                />
                <View style={styles.folderRowInnerIcon}>
                  <MaterialCommunityIcons
                    name={getVideoFolderIcon(item.folderName).innerIcon}
                    size={20}
                    color={getVideoFolderIcon(item.folderName).innerColor}
                  />
                </View>
              </View>
              <View style={styles.folderRowMeta}>
                <Text numberOfLines={1} style={styles.folderRowName}>
                  {item.folderName}
                </Text>
                <Text style={styles.folderRowSub}>{item.videos.length} videos</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={Colors.textMuted}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

