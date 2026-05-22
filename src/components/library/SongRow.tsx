import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { RectButton } from 'react-native-gesture-handler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useProgress } from 'react-native-track-player';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { Song } from '../../types';
import { formatTime } from '../../utils/formatTime';
import { toImageSource } from '../../utils/mediaUri';

type Props = {
  song: Song;
  active: boolean;
  playing: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onAddQueue: () => void;
  rightAction?: {
    icon: string;
    backgroundColor: string;
    onPress: () => void;
    iconColor?: string;
  };
};

export const SongRow = React.memo((
{
  song,
  active,
  playing,
  onPress,
  onLongPress,
  onAddQueue,
  rightAction,
}: Props): React.ReactElement => {
  // Only poll progress when this row is the active playing track
  // This avoids 250ms re-renders in MusicTab for all rows
  const { position, duration } = useProgress(active && playing ? 250 : 0);

  const addQueue = (
    <RectButton style={[styles.side, styles.sideAdd]} onPress={onAddQueue}>
      <MaterialCommunityIcons name="playlist-plus" size={22} color="#fff" />
    </RectButton>
  );
  return (
    <Swipeable
      overshootRight={false}
      overshootLeft={false}
      renderLeftActions={() => addQueue}
      renderRightActions={() =>
        rightAction ? (
          <RectButton
            style={[styles.side, { backgroundColor: rightAction.backgroundColor }]}
            onPress={rightAction.onPress}>
            <MaterialCommunityIcons
              name={rightAction.icon}
              size={22}
              color={rightAction.iconColor ?? '#fff'}
            />
          </RectButton>
        ) : null
      }>
      <RectButton onPress={onPress} onLongPress={onLongPress} style={[styles.row, active && styles.active]}>
        {song.albumArt ? (
          <Image source={toImageSource(song.albumArt)} style={styles.art} resizeMode="cover" />
        ) : (
          <View style={[styles.art, styles.artPlaceholder]} />
        )}
        <View style={styles.meta}>
          <Text numberOfLines={1} style={[Typography.subtitle, styles.t]}>
            {song.title}
          </Text>
          <Text numberOfLines={1} style={[Typography.body, styles.a]}>
            {song.artist}
          </Text>
        </View>
        {playing && active ? (
          <MaterialCommunityIcons name="equalizer" size={22} color={Colors.accent3} />
        ) : null}
        <Text style={[Typography.caption, styles.d]}>
          {active && playing && position > 0 && duration > 0
            ? `${formatTime(position)} / ${formatTime(duration)}`
            : formatTime(song.duration)}
        </Text>
      </RectButton>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassBorder,
  },
  active: { backgroundColor: 'rgba(168,85,247,0.12)' },
  art: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
  t: { color: Colors.textPrimary },
  a: { color: Colors.textSecondary },
  d: { color: Colors.textMuted, marginLeft: 8 },
  side: { width: 72, justifyContent: 'center', alignItems: 'center' },
  sideAdd: { backgroundColor: Colors.success },
  artPlaceholder: { backgroundColor: Colors.surfaceElevated },
  meta: { flex: 1 },
});
