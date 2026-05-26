import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { styles } from '../../styles/components/library/SkeletonLoaderStyles';

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
