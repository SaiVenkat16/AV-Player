import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { usePressScale } from '../../hooks/useGestures';

const APressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & { children: React.ReactNode };

export function AnimatedPressable({ children, onPressIn, onPressOut, ...rest }: Props): React.ReactElement {
  const { scale, down, up } = usePressScale();
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <APressable
      {...rest}
      style={[rest.style, style]}
      onPressIn={(e) => {
        down();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        up();
        onPressOut?.(e);
      }}>
      {children}
    </APressable>
  );
}
