import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import type { Video } from '../../types';
import { toImageSource } from '../../utils/mediaUri';
import { formatTime } from '../../utils/formatTime';
import { useLibraryStore } from '../../store/libraryStore';
import { styles } from '../../styles/components/video/VideoListItemStyles';

function formatSize(bytes: number): string {
  if (bytes === 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface VideoListItemProps {
  item: Video;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress: (video: Video, pageY: number) => void;
  selected?: boolean;
  selectionMode?: boolean;
}

export function VideoListItem({
  item,
  onPress,
  onLongPress,
  onMenuPress,
  selected = false,
  selectionMode = false,
}: VideoListItemProps): React.ReactElement {
  const ensureThumb = useLibraryStore((s) => s.ensureVideoThumbnail);
  const invalidateThumb = useLibraryStore((s) => s.invalidateVideoThumbnail);
  const [thumbState, setThumbState] = useState<'loading' | 'ready' | 'failed'>(
    item.thumbnailUri ? 'ready' : 'loading',
  );

  // Lazy generate thumbnail when this row mounts/becomes visible
  useEffect(() => {
    if (item.thumbnailUri) {
      setThumbState('ready');
      return;
    }
    let alive = true;
    setThumbState('loading');
    ensureThumb(item.id)
      .then(() => {
        if (alive) setThumbState('ready');
      })
      .catch(() => {
        if (alive) setThumbState('failed');
      });
    return () => {
      alive = false;
    };
  }, [ensureThumb, item.id, item.thumbnailUri]);

  const handleImageError = () => {
    // Stale cache or broken file - clear and retry once
    invalidateThumb(item.id);
    setThumbState('loading');
    ensureThumb(item.id, { force: true })
      .then(() => setThumbState('ready'))
      .catch(() => setThumbState('failed'));
  };

  return (
    <Pressable
      style={[styles.videoItem, selected && styles.videoItemSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: 'rgba(255,255,255,0.07)' }}>
      {selectionMode && (
        <MaterialCommunityIcons
          name={
            selected
              ? 'checkbox-marked-circle'
              : 'checkbox-blank-circle-outline'
          }
          size={22}
          color={selected ? Colors.accent1 : Colors.textMuted}
          style={styles.selectIcon}
        />
      )}
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {thumbState === 'ready' && item.thumbnailUri ? (
          <Image
            source={toImageSource(item.thumbnailUri)}
            style={styles.thumb}
            resizeMode="cover"
            onError={handleImageError}
          />
        ) : (
          <LinearGradient colors={['#1a1a35', '#0d0d1f']} style={styles.thumb}>
            <MaterialCommunityIcons
              name={thumbState === 'failed' ? 'video-off-outline' : 'play-circle-outline'}
              size={28}
              color={thumbState === 'failed' ? Colors.textMuted : Colors.accent1}
            />
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

      {/* 3-dot menu (hidden in selection mode) */}
      {!selectionMode && (
        <Pressable
          hitSlop={12}
          onPress={(e) => onMenuPress(item, e.nativeEvent.pageY)}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={20}
            color={Colors.textMuted}
          />
        </Pressable>
      )}
    </Pressable>
  );
}
