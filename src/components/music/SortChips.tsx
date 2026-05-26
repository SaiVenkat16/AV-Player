import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { SortMode } from '../../types';
import { styles } from '../../styles/components/music/SortChipsStyles';

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
          style={[styles.sortChip, activeSort === m && styles.sortOn]}
          hitSlop={8}>
          <Text style={[Typography.caption, { color: activeSort === m ? Colors.textPrimary : Colors.textMuted }]}>
            {m.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

