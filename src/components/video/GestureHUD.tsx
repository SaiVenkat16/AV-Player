import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

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

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    elevation: 40,
  },
  card: {
    width: 120,
    minHeight: 120,
    borderRadius: 22,
    backgroundColor: 'rgba(15,15,26,0.72)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    padding: 12,
  },
  icon: { fontSize: 32, marginBottom: 4 },
  lab: { color: Colors.textPrimary, marginBottom: 8 },
  track: {
    width: 10,
    height: 100,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: { width: '100%', backgroundColor: Colors.accent2 },
});
