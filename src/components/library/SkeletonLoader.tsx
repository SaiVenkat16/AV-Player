import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';

export function SkeletonLoader({ height = 14 }: { height?: number }): React.ReactElement {
  const o = useSharedValue(0.35);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 700 }), withTiming(0.35, { duration: 700 })),
      -1,
      false,
    );
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.box, { height }, style]} />;
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
});
