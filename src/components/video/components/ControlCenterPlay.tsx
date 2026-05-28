import React from 'react';
import { Pressable, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../../../styles/components/video/EmbeddedVideoPlayerStyles';

interface ControlCenterPlayProps {
  paused: boolean;
  onTogglePlay: () => void;
  onSeek: (delta: number) => void;
}

export function ControlCenterPlay({
  paused,
  onTogglePlay,
  onSeek,
}: ControlCenterPlayProps): React.ReactElement {
  return (
    <View style={styles.centerRow} pointerEvents="box-none">
      <Pressable onPress={() => onSeek(-10)} style={styles.seekBtn} hitSlop={16}>
        <MaterialCommunityIcons name="rewind-10" size={28} color="#fff" />
      </Pressable>
      <Pressable onPress={onTogglePlay} style={styles.playPauseBtn} hitSlop={8}>
        <MaterialCommunityIcons
          name={paused ? 'play-circle' : 'pause-circle'}
          size={56}
          color="#fff"
        />
      </Pressable>
      <Pressable onPress={() => onSeek(10)} style={styles.seekBtn} hitSlop={16}>
        <MaterialCommunityIcons name="fast-forward-10" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}
