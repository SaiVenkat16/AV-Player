import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheet } from '../common/BottomSheet';
import { Typography } from '../../theme/typography';
import { styles } from '../../styles/components/player/SleepTimerSheetStyles';

interface SleepTimerSheetProps {
  visible: boolean;
  onClose: () => void;
  sleepMin: number | null;
  onSetMin: (m: number | null) => void;
  sleepEnd: boolean;
  onToggleEnd: () => void;
  onClear: () => void;
}

const DURATIONS = [5, 10, 15, 30, 45, 60, 90];

export function SleepTimerSheet({
  visible,
  onClose,
  sleepMin,
  onSetMin,
  sleepEnd,
  onToggleEnd,
  onClear,
}: SleepTimerSheetProps): React.ReactElement {
  const isActive = sleepMin != null || sleepEnd;
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Sleep timer" heightFraction={0.5}>
      <Text style={[Typography.body, styles.info]}>
        {sleepMin != null ? `Stopping in ${sleepMin} min` : 'Pick duration'}
      </Text>
      <View style={styles.chipRow}>
        {DURATIONS.map((m) => (
          <Pressable key={m} style={styles.sleepChip} onPress={() => onSetMin(m)}>
            <Text style={styles.chipText}>{m}m</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.toggleRow} onPress={onToggleEnd}>
        <View style={[styles.checkbox, sleepEnd && styles.checkboxOn]} />
        <Text style={styles.toggleLabel}>End of current song: {sleepEnd ? 'ON' : 'OFF'}</Text>
      </Pressable>
      {isActive ? (
        <Pressable style={styles.clearRow} onPress={onClear}>
          <Text style={styles.clearText}>Clear timer</Text>
        </Pressable>
      ) : null}
    </BottomSheet>
  );
}

