import React, { useRef } from 'react';
import { View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { AnimatedPressable } from '../common/AnimatedPressable';
import { usePlayerStore } from '../../store/playerStore';
import { styles } from '../../styles/components/player/PlayerControlsStyles';


export function PlayerControls(): React.ReactElement {
  const toggle = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.nextSong);
  const prev = usePlayerStore((s) => s.prevSong);
  const shuffle = usePlayerStore((s) => s.shuffleMode);
  const repeat = usePlayerStore((s) => s.repeatMode);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const seek = usePlayerStore((s) => s.seekTo);
  const pos = usePlayerStore((s) => s.position);
  const long = useRef(false);
  return (
    <View style={styles.row}>
      <AnimatedPressable onPress={() => toggleShuffle()} style={styles.side}>
        <MaterialCommunityIcons
          name="shuffle"
          size={22}
          color={shuffle ? Colors.accent2 : Colors.textMuted}
        />
      </AnimatedPressable>
      <AnimatedPressable
        onLongPress={() => {
          long.current = true;
          seek(Math.max(0, pos - 10));
        }}
        onPress={() => {
          if (!long.current) {
            prev();
          }
          long.current = false;
        }}
        style={styles.side}>
        <MaterialCommunityIcons name="skip-previous" size={28} color={Colors.textPrimary} />
      </AnimatedPressable>
      <AnimatedPressable onPress={() => toggle()} style={styles.play}>
        <MaterialCommunityIcons
          name={isPlaying ? 'pause' : 'play'}
          size={40}
          color={Colors.textPrimary}
        />
      </AnimatedPressable>
      <AnimatedPressable
        onLongPress={() => {
          long.current = true;
          seek(pos + 10);
        }}
        onPress={() => {
          if (!long.current) {
            next();
          }
          long.current = false;
        }}
        style={styles.side}>
        <MaterialCommunityIcons name="skip-next" size={28} color={Colors.textPrimary} />
      </AnimatedPressable>
      <AnimatedPressable onPress={() => cycleRepeat()} style={styles.side}>
        <MaterialCommunityIcons
          name={
            repeat === 'one' ? 'repeat-once' : repeat === 'all' ? 'repeat' : 'repeat-off'
          }
          size={22}
          color={repeat === 'off' ? Colors.textMuted : Colors.accent1}
        />
      </AnimatedPressable>
    </View>
  );
}

