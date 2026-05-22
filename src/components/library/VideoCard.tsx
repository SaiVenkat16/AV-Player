import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { Video } from '../../types';
import { formatBytes, formatTime } from '../../utils/formatTime';
import { toImageSource } from '../../utils/mediaUri';
import { useLibraryStore } from '../../store/libraryStore';

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

const styles = StyleSheet.create({
  card: { flex: 1, marginBottom: 12 },
  thumbWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  thumb: { width: '100%', height: '100%' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  play: { position: 'absolute', alignSelf: 'center', top: '35%' },
  dur: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  durT: { color: Colors.textPrimary, fontSize: 10, fontWeight: '700' },
  title: { color: Colors.textPrimary, marginTop: 10, paddingHorizontal: 4 },
  meta: { color: Colors.textMuted, marginTop: 2, paddingHorizontal: 4 },
});
