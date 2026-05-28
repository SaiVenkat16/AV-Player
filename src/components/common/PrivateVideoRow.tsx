import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { useLibraryStore } from '../../store/libraryStore';
import type { Video } from '../../types';
import { toImageSource } from '../../utils/mediaUri';
import { formatTime } from '../../utils/formatTime';
import { styles } from '../../styles/components/common/PrivateVideoRowStyles';

interface Props {
  item: Video;
  onOpen: () => void;
  onRestore: () => void;
}

export function PrivateVideoRow({
  item,
  onOpen,
  onRestore,
}: Props): React.ReactElement {
  const ensureThumb = useLibraryStore((s) => s.ensureVideoThumbnail);
  const invalidateThumb = useLibraryStore((s) => s.invalidateVideoThumbnail);
  const [thumbState, setThumbState] = useState<'loading' | 'ready' | 'failed'>(
    item.thumbnailUri ? 'ready' : 'loading',
  );

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
    invalidateThumb(item.id);
    setThumbState('loading');
    ensureThumb(item.id, { force: true })
      .then(() => setThumbState('ready'))
      .catch(() => setThumbState('failed'));
  };

  return (
    <Pressable
      style={styles.row}
      onPress={onOpen}
      android_ripple={{ color: 'rgba(255,255,255,0.07)' }}
    >
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
              name={
                thumbState === 'failed'
                  ? 'video-off-outline'
                  : 'play-circle-outline'
              }
              size={24}
              color={
                thumbState === 'failed' ? Colors.textMuted : Colors.accent1
              }
            />
          </LinearGradient>
        )}
        {item.duration > 0 && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatTime(item.duration)}</Text>
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <Text numberOfLines={2} style={styles.title}>
          {item.title}
        </Text>
        {item.width > 0 && item.height > 0 && (
          <Text style={styles.sub}>
            {item.width}×{item.height}
          </Text>
        )}
      </View>

      <Pressable hitSlop={12} onPress={onRestore} style={styles.restoreBtn}>
        <MaterialCommunityIcons
          name="lock-open-outline"
          size={20}
          color={Colors.textMuted}
        />
      </Pressable>
    </Pressable>
  );
}
