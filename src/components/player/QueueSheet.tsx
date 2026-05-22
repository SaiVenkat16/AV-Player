import React from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AutoDragSortableView } from 'react-native-drag-sort';
import { BottomSheet } from '../common/BottomSheet';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatTime } from '../../utils/formatTime';
import { toImageSource } from '../../utils/mediaUri';
import type { Song } from '../../types';

interface QueueSheetProps {
  visible: boolean;
  onClose: () => void;
  queue: Song[];
  onClearQueue: () => void;
  onReorder: (from: number, to: number) => void;
}

export function QueueSheet({
  visible,
  onClose,
  queue,
  onClearQueue,
  onReorder,
}: QueueSheetProps): React.ReactElement {
  const windowWidth = Dimensions.get('window').width;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Queue" heightFraction={0.65}>
      <Pressable onPress={onClearQueue} style={styles.clearBtn}>
        <Text style={[Typography.subtitle, styles.clearText]}>Clear queue</Text>
      </Pressable>
      <AutoDragSortableView
        dataSource={queue}
        parentWidth={windowWidth - 32}
        childrenHeight={56}
        childrenWidth={windowWidth - 32}
        marginChildrenLeft={0}
        marginChildrenRight={0}
        marginChildrenTop={0}
        marginChildrenBottom={0}
        keyExtractor={(item) => item.id}
        renderItem={(item: Song) => (
          <View style={styles.qRow}>
            {item.albumArt && toImageSource(item.albumArt) ? (
              <Image source={toImageSource(item.albumArt)!} style={styles.qArt} resizeMode="cover" />
            ) : (
              <View style={[styles.qArt, styles.qArtPlaceholder]} />
            )}
            <View style={styles.qMeta}>
              <Text numberOfLines={1} style={[Typography.subtitle, styles.qTitle]}>{item.title}</Text>
              <Text numberOfLines={1} style={[Typography.caption, styles.qArtist]}>{item.artist}</Text>
            </View>
            <Text style={[Typography.caption, styles.qDuration]}>
              {formatTime(item.duration)}
            </Text>
          </View>
        )}
        onDragEnd={onReorder}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  clearBtn: { paddingVertical: 8, marginBottom: 8 },
  qRow: { flexDirection: 'row', alignItems: 'center', height: 56 },
  qArt: { width: 32, height: 32, borderRadius: 8, marginRight: 10, backgroundColor: Colors.surface },
  clearText: { color: Colors.danger },
  qArtPlaceholder: { backgroundColor: Colors.surfaceElevated },
  qMeta: { flex: 1 },
  qTitle: { color: Colors.textPrimary },
  qArtist: { color: Colors.textMuted },
  qDuration: { color: Colors.textMuted },
});
