import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { EqualizerService } from '../../services/EqualizerService';
import { styles } from '../../styles/components/equalizer/PresetSelectorStyles';

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
          <Pressable key={n} onPress={() => onSelect(n)} style={styles.chip} hitSlop={6}>
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

