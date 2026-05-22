import React from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Colors } from '../../theme/colors';

type Props = ViewProps & { intensity?: number; children: React.ReactNode };

export function GlassCard({
  style,
  intensity = 28,
  children,
  ...rest
}: Props): React.ReactElement {
  return (
    <View style={[styles.outer, style]} {...rest}>
      <BlurView
        blurAmount={Platform.OS === 'ios' ? intensity : 18}
        blurType="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glassWhite,
  },
  inner: { padding: 12 },
});
