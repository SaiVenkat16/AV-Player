import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { styles } from '../../styles/components/common/GlassCardStyles';

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
        style={styles.absoluteFill}
      />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

