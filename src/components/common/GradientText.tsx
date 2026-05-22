import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';

type Props = TextProps & { colors?: readonly [string, string, ...string[]] };

export function GradientText({
  style,
  colors = Colors.gradient1,
  children,
  ...rest
}: Props): React.ReactElement {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, style, styles.maskFill]} {...rest}>
          {children}
        </Text>
      }>
      <LinearGradient colors={[...colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[styles.text, style, styles.hidden]} {...rest}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: { backgroundColor: 'transparent' },
  /** Opaque mask glyph — required for MaskedView on some Android builds. */
  maskFill: { color: '#000000' },
  hidden: { opacity: 0 },
});
