import React from 'react';
import { Text, View } from 'react-native';
import { Typography } from '../../theme/typography';
import { styles } from '../../styles/components/video/GestureHUDStyles';

type Props = {
  visible: boolean;
  icon: string;
  label: string;
  barFraction: number;
};

export function GestureHUD({ visible, icon, label, barFraction }: Props): React.ReactElement | null {
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.card}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[Typography.title, styles.lab]}>{label}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { height: Math.max(4, Math.round(barFraction * 100)) }]} />
        </View>
      </View>
    </View>
  );
}

