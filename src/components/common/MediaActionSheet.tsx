import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { BottomSheet } from './BottomSheet';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { useVideoPlayerStore } from '../../store/videoPlayerStore';
import { toImageSource } from '../../utils/mediaUri';
import { formatBytes } from '../../utils/formatTime';
import { showThemedAlert } from '../../utils/themedAlert';
import { styles } from '../../styles/components/common/MediaActionSheetStyles';
import type { Song, Video } from '../../types';

interface MediaActionSheetProps {
  visible: boolean;
  onClose: () => void;
  item: Song | Video | null;
  type: 'song' | 'video' | null;
}

export function MediaActionSheet({
  visible,
  onClose,
  item,
  type,
}: MediaActionSheetProps): React.ReactElement | null {
  const navigation = useNavigation<any>();

  const privateIds = useLibraryStore((s) => s.privateIds);
  const favorites = useLibraryStore((s) => s.favorites);
  const togglePrivateId = useLibraryStore((s) => s.togglePrivateId);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const removeSongFromLibrary = useLibraryStore((s) => s.removeSongFromLibrary);
  const removeVideoFromLibrary = useLibraryStore((s) => s.removeVideoFromLibrary);

  const playSong = usePlayerStore((s) => s.playSong);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  if (!item || !type) {
    return null;
  }

  const isSong = type === 'song';
  const isVideo = type === 'video';

  const isPrivate = privateIds.includes(item.id);
  const isFavorite = favorites.includes(item.id);

  const handlePlayNow = () => {
    onClose();
    if (isSong) {
      const song = item as Song;
      playSong(song, [song]);
      navigation.navigate('Music', { screen: 'NowPlaying' });
    } else if (isVideo) {
      // Video player is rendered as a global overlay (see VideoPlayerOverlay
      // in AppBootstrap). It is not a registered route, so we open it via
      // the dedicated store rather than navigation.
      useVideoPlayerStore.getState().openVideo(item.id);
    }
  };

  const handleAddToQueue = () => {
    if (isSong) {
      addToQueue(item as Song);
      onClose();
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(item.id);
    onClose();
  };

  const handleTogglePrivate = () => {
    const actionText = isPrivate ? 'Restore' : 'Move';
    showThemedAlert({
      title: `${actionText} Media`,
      message: `Are you sure you want to ${actionText.toLowerCase()} "${item.title}" ${
        isPrivate ? 'back to the main library' : 'to Private Folder'
      }?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          style: 'default',
          onPress: () => {
            togglePrivateId(item.id);
            onClose();
          },
        },
      ],
    });
  };

  const handleDelete = () => {
    showThemedAlert({
      title: 'Delete Media',
      message: `Are you sure you want to delete "${item.title}" from your library?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (isSong) {
              removeSongFromLibrary(item.id);
            } else {
              removeVideoFromLibrary(item.id);
            }
            onClose();
          },
        },
      ],
    });
  };

  // Render header art
  const renderHeaderArt = () => {
    if (isSong) {
      const song = item as Song;
      return song.albumArt ? (
        <Image source={toImageSource(song.albumArt)} style={styles.headerArt} />
      ) : (
        <View style={styles.headerArt}>
          <MaterialCommunityIcons name="music" size={24} color={Colors.accent1} />
        </View>
      );
    } else {
      const video = item as Video;
      return video.thumbnailUri ? (
        <Image source={toImageSource(video.thumbnailUri)} style={styles.headerArt} resizeMode="cover" />
      ) : (
        <View style={styles.headerArt}>
          <MaterialCommunityIcons name="video" size={24} color={Colors.accent2} />
        </View>
      );
    }
  };

  // Render header subtitle
  const getSubtitle = () => {
    if (isSong) {
      const song = item as Song;
      return song.artist || 'Unknown Artist';
    } else {
      const video = item as Video;
      const sizeStr = video.sizeBytes ? formatBytes(video.sizeBytes) : '';
      const resStr = video.width ? `${video.width}×${video.height}` : '';
      return [sizeStr, resStr].filter(Boolean).join(' · ') || 'Video File';
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} heightFraction={isSong ? 0.52 : 0.45}>
      <View style={styles.sheetContainer}>
        {/* Header */}
        <View style={styles.header}>
          {renderHeaderArt()}
          <View style={styles.headerMeta}>
            <Text numberOfLines={1} style={[Typography.subtitle, styles.headerTitle]}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={[Typography.caption, styles.headerSub]}>
              {getSubtitle()}
            </Text>
          </View>
        </View>

        {/* Play Now */}
        <Pressable
          style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
          onPress={handlePlayNow}
        >
          <View style={[styles.iconWrap, { backgroundColor: Colors.accent2 + '15' }]}>
            <MaterialCommunityIcons name="play-circle-outline" size={22} color={Colors.accent2} />
          </View>
          <Text style={[Typography.subtitle, styles.optionText]}>Play Now</Text>
        </Pressable>

        {/* Add to Queue (Audio Only) */}
        {isSong && (
          <Pressable
            style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
            onPress={handleAddToQueue}
          >
            <View style={[styles.iconWrap, { backgroundColor: Colors.accent1 + '15' }]}>
              <MaterialCommunityIcons name="playlist-plus" size={22} color={Colors.accent1} />
            </View>
            <Text style={[Typography.subtitle, styles.optionText]}>Add to Play Queue</Text>
          </Pressable>
        )}

        {/* Favorite / Unfavorite */}
        <Pressable
          style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
          onPress={handleToggleFavorite}
        >
          <View style={[styles.iconWrap, { backgroundColor: Colors.danger + '15' }]}>
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={Colors.danger}
            />
          </View>
          <Text style={[Typography.subtitle, styles.optionText]}>
            {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </Text>
        </Pressable>

        {/* Move to Private Vault / Restore from Vault */}
        <Pressable
          style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
          onPress={handleTogglePrivate}
        >
          <View style={[styles.iconWrap, { backgroundColor: Colors.accent3 + '15' }]}>
            <MaterialCommunityIcons
              name={isPrivate ? 'shield-off-outline' : 'shield-lock-outline'}
              size={22}
              color={Colors.accent3}
            />
          </View>
          <Text style={[Typography.subtitle, styles.optionText]}>
            {isPrivate ? 'Restore from Vault' : 'Move to Private Space'}
          </Text>
        </Pressable>

        {/* Delete from Library */}
        <Pressable
          style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
          onPress={handleDelete}
        >
          <View style={[styles.iconWrap, { backgroundColor: Colors.danger + '15' }]}>
            <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.danger} />
          </View>
          <Text style={[Typography.subtitle, styles.optionText, { color: Colors.danger }]}>
            Delete from Library
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
