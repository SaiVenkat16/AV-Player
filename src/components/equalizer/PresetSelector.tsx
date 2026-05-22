import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { EqualizerService } from '../../services/EqualizerService';

type Props = {
  active: string;
  onSelect: (name: string) => void;
};

const NAMES = Object.keys(EqualizerService.presets).concat(['Custom']);

export function PresetSelector({ active, onSelect }: Props): React.ReactElement {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {NAMES.map((n) => {
        const on = n === active;
        return (
          <Pressable key={n} onPress={() => onSelect(n)} style={styles.chip}>
            {on ? (
              <LinearGradient colors={[...Colors.gradient1]} style={styles.grad}>
                <Text style={[Typography.caption, styles.tOn]}>{n}</Text>
              </LinearGradient>
            ) : (
              <Text style={[Typography.caption, styles.tOff]}>{n}</Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, gap: 8 },
  chip: { marginRight: 8, borderRadius: 16, overflow: 'hidden' },
  grad: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  tOn: { color: Colors.textPrimary, fontWeight: '700' },
  tOff: {
    color: Colors.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
});
