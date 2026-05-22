import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { SortMode } from '../../types';

interface SortChipsProps {
  activeSort: SortMode;
  onSortChange: (mode: SortMode) => void;
}

const MODES: SortMode[] = ['az', 'date', 'duration', 'artist'];

export function SortChips({ activeSort, onSortChange }: SortChipsProps): React.ReactElement {
  return (
    <View style={styles.sortRow}>
      {MODES.map((m) => (
        <Pressable
          key={m}
          onPress={() => onSortChange(m)}
          style={[styles.sortChip, activeSort === m && styles.sortOn]}>
          <Text style={[Typography.caption, { color: activeSort === m ? Colors.textPrimary : Colors.textMuted }]}>
            {m.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 6 },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  sortOn: { backgroundColor: 'rgba(168,85,247,0.2)' },
});
