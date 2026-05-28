import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { styles } from '../../styles/screens/video/VideoFolderStyles';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import type { VideoStackParamList } from '../../navigation/VideoStack';
import { useLibraryStore } from '../../store/libraryStore';
import { useVideoPlayerStore } from '../../store/videoPlayerStore';
import { useSelectionStore } from '../../store/selectionStore';
import type { Video } from '../../types';
import { VideoListItem } from '../../components/video/VideoListItem';
import { SelectionToolbar } from '../../components/common/SelectionToolbar';
import { useBottomPadding } from '../../hooks/useBottomPadding';
import { showThemedAlert } from '../../utils/themedAlert';
import {
  deleteMediaFile,
  deleteMediaFilesBulk,
  shareMediaFile,
  shareMediaFilesBulk,
} from '../../services/FileOpsService';

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
  const favoriteIds = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const togglePrivateId = useLibraryStore((s) => s.togglePrivateId);
  const removeVideoFromLibrary = useLibraryStore((s) => s.removeVideoFromLibrary);

  const { height: windowHeight } = useWindowDimensions();
  const [menuVideo, setMenuVideo] = useState<Video | null>(null);
  const [menuPosition, setMenuPosition] = useState(0);

  // Selection mode wiring
  const selectionMode = useSelectionStore((s) => s.mode);
  const selectionActive = useSelectionStore((s) => s.isActive);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const enterSelection = useSelectionStore((s) => s.enter);
  const toggleSelection = useSelectionStore((s) => s.toggle);
  const exitSelection = useSelectionStore((s) => s.exit);
  const selectAll = useSelectionStore((s) => s.selectAll);

  const isVideoSelectMode = selectionActive && selectionMode === 'video';

  // Exit selection when navigating away from this screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (useSelectionStore.getState().mode === 'video') {
          useSelectionStore.getState().exit();
        }
      };
    }, []),
  );

  // Exit on Android back press while in selection mode
  useEffect(() => {
    if (!isVideoSelectMode) return;
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (useSelectionStore.getState().isActive) {
        e.preventDefault();
        exitSelection();
      }
    });
    return sub;
  }, [navigation, isVideoSelectMode, exitSelection]);

  const folderVideos = useMemo(() => {
    const normFolder = folderPath.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '');
    const APP_ROOT_FOLDERS = [
      'Telegram',
      'WhatsApp',
      'Instagram',
      'Snapchat',
      'Facebook',
      'TikTok',
    ];
    const appMatch = normFolder.startsWith('__app__/')
      ? normFolder.slice('__app__/'.length).toLowerCase()
      : null;

    return videos.filter((v) => {
      if (privateIds.includes(v.id)) return false;
      const norm = v.path.replace(/\\/g, '/').replace(/\/+/g, '/');

      if (appMatch) {
        const segments = norm.split('/');
        return segments.some((seg) => seg.toLowerCase() === appMatch);
      }

      const segments = norm.split('/');
      const insideAppRoot = segments.some((seg) =>
        APP_ROOT_FOLDERS.some((app) => app.toLowerCase() === seg.toLowerCase()),
      );
      if (insideAppRoot) return false;

      const lastSlash = norm.lastIndexOf('/');
      if (lastSlash <= 0) return false;
      const parent = norm.slice(0, lastSlash);
      return parent === normFolder;
    });
  }, [videos, privateIds, folderPath]);

  const filtered = useMemo(() => {
    return [...folderVideos].sort((a, b) => a.title.localeCompare(b.title));
  }, [folderVideos]);

  const handleOpen = useCallback(
    (video: Video) => {
      useVideoPlayerStore
        .getState()
        .openVideo(video.id, filtered.map((v) => v.id));
    },
    [filtered],
  );

  const handleMenuPress = useCallback((video: Video, pageY: number) => {
    setMenuPosition(pageY);
    setMenuVideo(video);
  }, []);

  const closeMenu = useCallback(() => setMenuVideo(null), []);
  const isFavorite = menuVideo ? favoriteIds.includes(menuVideo.id) : false;

  const handleDelete = useCallback(() => {
    const v = menuVideo;
    if (!v) return;
    closeMenu();
    showThemedAlert({
      title: 'Delete from device?',
      message: `This will permanently delete "${v.title}" from your device. This cannot be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteMediaFile(v.path, true);
            if (ok) removeVideoFromLibrary(v.id);
          },
        },
      ],
    });
  }, [menuVideo, removeVideoFromLibrary, closeMenu]);

  const handleShare = useCallback(async () => {
    const v = menuVideo;
    if (!v) return;
    closeMenu();
    await shareMediaFile(v.path, v.title, true);
  }, [menuVideo, closeMenu]);

  // Selection mode handlers
  const handleItemLongPress = useCallback(
    (video: Video) => {
      if (isVideoSelectMode) return;
      enterSelection('video', video.id);
    },
    [isVideoSelectMode, enterSelection],
  );

  const handleItemPress = useCallback(
    (video: Video) => {
      if (isVideoSelectMode) {
        toggleSelection(video.id);
      } else {
        handleOpen(video);
      }
    },
    [isVideoSelectMode, toggleSelection, handleOpen],
  );

  const handleSelectAll = useCallback(() => {
    const allIds = filtered.map((v) => v.id);
    const isAllSelected =
      allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    if (isAllSelected) {
      // Deselect all but stay in selection mode is awkward — exit instead
      // of clearing to an empty selection (which would auto-exit anyway).
      useSelectionStore.getState().clear();
    } else {
      selectAll(allIds);
    }
  }, [selectAll, filtered, selectedIds]);

  const selectedVideos = useMemo(
    () => filtered.filter((v) => selectedIds.includes(v.id)),
    [filtered, selectedIds],
  );

  const handleBulkShare = useCallback(async () => {
    if (selectedVideos.length === 0) return;
    await shareMediaFilesBulk(
      selectedVideos.map((v) => v.path),
      true,
    );
  }, [selectedVideos]);

  const handleBulkDelete = useCallback(() => {
    if (selectedVideos.length === 0) return;
    showThemedAlert({
      title: `Delete ${selectedVideos.length} videos?`,
      message: 'This will permanently delete the selected videos from your device.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const deleted = await deleteMediaFilesBulk(
              selectedVideos.map((v) => v.path),
              true,
            );
            if (deleted > 0) {
              for (const v of selectedVideos) {
                removeVideoFromLibrary(v.id);
              }
              exitSelection();
            }
          },
        },
      ],
    });
  }, [selectedVideos, removeVideoFromLibrary, exitSelection]);

  return (
    <View style={styles.root}>
      {isVideoSelectMode ? (
        <SelectionToolbar
          count={selectedIds.length}
          onClose={exitSelection}
          onSelectAll={handleSelectAll}
          onShare={handleBulkShare}
          onDelete={handleBulkDelete}
        />
      ) : (
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text numberOfLines={1} style={styles.headerTitle}>{folderName}</Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>
      )}

      <FlashList showsVerticalScrollIndicator={false}
        data={filtered}
        estimatedItemSize={88}
        keyExtractor={(v) => v.id}
        extraData={`${isVideoSelectMode ? '1' : '0'}|${selectedIds.join(',')}`}
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
            onPress={() => handleItemPress(item)}
            onLongPress={() => handleItemLongPress(item)}
            onMenuPress={handleMenuPress}
            selectionMode={isVideoSelectMode}
            selected={selectedIds.includes(item.id)}
          />
        )}
      />

      {/* 3-dot popup menu */}
      <Modal
        visible={menuVideo !== null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeMenu}>
          <View
            style={[
              styles.miniModal,
              (() => {
                const MENU_HEIGHT = 220;
                const SAFE_BOTTOM = 80;
                const wouldOverflow = menuPosition + MENU_HEIGHT > windowHeight - SAFE_BOTTOM;
                if (wouldOverflow) {
                  return { bottom: Math.max(SAFE_BOTTOM, windowHeight - menuPosition + 10) };
                }
                return { top: menuPosition - 10 };
              })(),
            ]}
          >
            <Pressable
              style={styles.miniModalItem}
              onPress={() => {
                if (menuVideo) toggleFavorite(menuVideo.id);
                closeMenu();
              }}
            >
              <Text style={styles.miniModalText}>
                {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.miniModalItem}
              onPress={() => {
                if (menuVideo) togglePrivateId(menuVideo.id);
                closeMenu();
              }}
            >
              <Text style={styles.miniModalText}>Move to private</Text>
            </Pressable>
            <Pressable style={styles.miniModalItem} onPress={handleShare}>
              <Text style={styles.miniModalText}>Share</Text>
            </Pressable>
            <Pressable style={styles.miniModalItem} onPress={handleDelete}>
              <Text style={[styles.miniModalText, styles.miniModalDanger]}>
                Delete from device
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
