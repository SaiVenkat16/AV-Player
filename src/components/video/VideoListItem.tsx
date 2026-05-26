import React from 'react';
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
  onLongPress: () => void;
}

export function VideoListItem({
  item,
  onPress,
  onLongPress,
}: VideoListItemProps): React.ReactElement {
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
