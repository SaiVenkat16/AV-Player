import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  colors: readonly [string, string, ...string[]];
};

const TRACK = 160;

export function EQSlider({ label, value, onChange, colors }: Props): React.ReactElement {
  const y = useSharedValue(((-value + 12) / 24) * TRACK);
  const pan = Gesture.Pan()
    .onChange((e) => {
      y.value = clamp(y.value + e.changeY, 0, TRACK);
      const gain = 12 - (y.value / TRACK) * 24;
      runOnJS(onChange)(gain);
    })
    .onEnd(() => {
      y.value = withSpring(y.value, { damping: 18, stiffness: 220 });
    });
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));
  return (
    <View style={styles.col}>
      <Text style={[Typography.micro, styles.lb]}>{label}</Text>
      <View style={styles.trackWrap}>
        <LinearGradient colors={[...colors]} style={styles.track} />
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.knob, knobStyle]} />
        </GestureDetector>
      </View>
      <Text style={[Typography.caption, styles.val]}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { alignItems: 'center', width: 56 },
  lb: { color: Colors.textMuted, marginBottom: 6 },
  trackWrap: {
    height: TRACK,
    width: 14,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: Colors.surface,
  },
  track: { flex: 1, width: '100%' },
  knob: {
    position: 'absolute',
    left: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textPrimary,
    shadowColor: Colors.accent1,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  val: { color: Colors.textSecondary, marginTop: 6 },
});
