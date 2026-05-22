import { useSharedValue, withSpring } from 'react-native-reanimated';

export function usePressScale(): {
  scale: ReturnType<typeof useSharedValue<number>>;
  down: () => void;
  up: () => void;
} {
  const scale = useSharedValue(1);
  const down = () => {
    scale.value = withSpring(0.95, { damping: 18, stiffness: 320 });
  };
  const up = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 280 });
  };
  return { scale, down, up };
}
