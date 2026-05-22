import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '../common/BottomSheet';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

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

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  sleepChip: {
    padding: 10,
    margin: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.surface,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: Colors.textSecondary },
  checkboxOn: { backgroundColor: Colors.accent1, borderColor: Colors.accent1 },
  info: { color: Colors.textSecondary },
  chipText: { color: Colors.textPrimary },
  toggleLabel: { color: Colors.textPrimary, marginLeft: 12 },
  clearRow: { marginTop: 18, alignSelf: 'flex-start' },
  clearText: { color: Colors.danger },
});
