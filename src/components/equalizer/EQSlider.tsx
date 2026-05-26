import React, { useRef } from 'react';
import { PanResponder, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Typography } from '../../theme/typography';
import { styles } from '../../styles/components/equalizer/EQSliderStyles';

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  colors: readonly [string, string, ...string[]];
};

const TRACK = 160;

export function EQSlider({ label, value, onChange, colors }: Props): React.ReactElement {
  const currentY = useRef(((-value + 12) / 24) * TRACK);
  const knobY = ((-value + 12) / 24) * TRACK;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        currentY.current = knobY;
      },
      onPanResponderMove: (_, gesture) => {
        const newY = Math.max(0, Math.min(TRACK, currentY.current + gesture.dy));
        const gain = Math.round((12 - (newY / TRACK) * 24) * 10) / 10;
        onChange(gain);
      },
    })
  ).current;

  return (
    <View style={styles.col}>
      <Text style={[Typography.micro, styles.lb]}>{label}</Text>
      <View style={styles.trackWrap} {...panResponder.panHandlers}>
        <LinearGradient colors={[...colors]} style={styles.track} />
        <View style={[styles.knob, { top: knobY }]} />
      </View>
      <Text style={[Typography.caption, styles.val]}>{value.toFixed(1)}</Text>
    </View>
  );
}
