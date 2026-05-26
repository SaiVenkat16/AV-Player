import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useProgress } from 'react-native-track-player';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { Song } from '../../types';
import { formatTime } from '../../utils/formatTime';
import { toImageSource } from '../../utils/mediaUri';
import { styles } from '../../styles/components/library/SongRowStyles';

type Props = {
  song: Song;
  active: boolean;
  playing: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onAddQueue?: () => void;
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

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        active && styles.active,
        pressed && { opacity: 0.75 },
      ]}
    >
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

      {/* Playing state visualizer */}
      {playing && active ? (
        <MaterialCommunityIcons
          name="equalizer"
          size={20}
          color={Colors.accent3}
          style={styles.eqIcon}
        />
      ) : null}

      {/* Add to Play Queue Action */}
      {onAddQueue ? (
        <Pressable
          onPress={onAddQueue}
          style={styles.actionBtn}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="playlist-plus"
            size={22}
            color={Colors.textSecondary}
          />
        </Pressable>
      ) : null}

      {/* Right action (Favorites toggle, remove from playlist, etc.) */}
      {rightAction ? (
        <Pressable
          onPress={rightAction.onPress}
          style={styles.actionBtn}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name={rightAction.icon}
            size={20}
            color={
              rightAction.iconColor ??
              (rightAction.backgroundColor === Colors.danger
                ? Colors.danger
                : Colors.accent1)
            }
          />
        </Pressable>
      ) : null}

      <Text style={[Typography.caption, styles.d]}>
        {active && playing && position > 0 && duration > 0
          ? `${formatTime(position)} / ${formatTime(duration)}`
          : formatTime(song.duration)}
      </Text>
    </Pressable>
  );
});
