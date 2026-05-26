import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { Video } from '../../types';
import { formatBytes, formatTime } from '../../utils/formatTime';
import { toImageSource } from '../../utils/mediaUri';
import { useLibraryStore } from '../../store/libraryStore';
import { styles } from '../../styles/components/library/VideoCardStyles';


type Props = {
  item: Video;
  onOpen: () => void;
  onLongMenu: () => void;
};

export function VideoCard({ item, onOpen, onLongMenu }: Props): React.ReactElement {
  const ensureVideoThumbnail = useLibraryStore((s) => s.ensureVideoThumbnail);
  const invalidateVideoThumbnail = useLibraryStore((s) => s.invalidateVideoThumbnail);
  const [thumbState, setThumbState] = useState<'ready' | 'loading' | 'failed'>(
    item.thumbnailUri ? 'ready' : 'loading',
  );
  const attemptedRepairRef = useRef(false);

  useEffect(() => {
    attemptedRepairRef.current = false;
    if (item.thumbnailUri) {
      setThumbState('ready');
      return;
    }

    let alive = true;
    setThumbState('loading');
    ensureVideoThumbnail(item.id)
      .then(() => {
        if (alive) {
          setThumbState('ready');
        }
      })
      .catch(() => {
        if (alive) {
          setThumbState('failed');
        }
      });

    return () => {
      alive = false;
    };
  }, [ensureVideoThumbnail, item.id, item.thumbnailUri]);

  const handleThumbError = useCallback(() => {
    if (attemptedRepairRef.current) {
      setThumbState('failed');
      return;
    }

    attemptedRepairRef.current = true;
    setThumbState('loading');
    invalidateVideoThumbnail(item.id);
    ensureVideoThumbnail(item.id, { force: true })
      .then(() => setThumbState('ready'))
      .catch(() => setThumbState('failed'));
  }, [ensureVideoThumbnail, invalidateVideoThumbnail, item.id]);

  return (
    <Pressable onPress={onOpen} onLongPress={onLongMenu} style={styles.card}>
      <View style={styles.thumbWrap}>
        {item.thumbnailUri ? (
          <Image
            source={toImageSource(item.thumbnailUri)}
            style={styles.thumb}
            resizeMode="cover"
            onError={handleThumbError}
          />
        ) : thumbState === 'loading' ? (
          <View style={[styles.thumb, styles.placeholder]}>
            <ActivityIndicator color={Colors.accent2} />
            <Text style={[Typography.caption, styles.placeholderText]}>
              Loading preview
            </Text>
          </View>
        ) : (
          <View style={[styles.thumb, styles.placeholder]}>
            <MaterialCommunityIcons
              name="image-broken-variant"
              size={28}
              color="rgba(255,255,255,0.65)"
            />
            <Text style={[Typography.caption, styles.placeholderText]}>
              No preview
            </Text>
          </View>
        )}
        <MaterialCommunityIcons
          name="play-circle"
          size={40}
          color="rgba(255,255,255,0.75)"
          style={styles.play}
        />
        <View style={styles.dur}>
          <Text style={[Typography.caption, styles.durT]}>
            {item.duration > 0 ? formatTime(item.duration) : '—'}
          </Text>
        </View>
      </View>
      <Text numberOfLines={2} style={[Typography.subtitle, styles.title]}>
        {item.title}
      </Text>
      <Text style={[Typography.caption, styles.meta]}>
        {formatBytes(item.sizeBytes)}
        {item.width > 0 ? ` · ${item.width}×${item.height}` : ''}
      </Text>
    </Pressable>
  );
}

