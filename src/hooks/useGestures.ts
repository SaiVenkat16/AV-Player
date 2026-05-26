import { useSharedValue, withTiming } from 'react-native-reanimated';

export function usePressScale(): {
  scale: ReturnType<typeof useSharedValue<number>>;
  down: () => void;
  up: () => void;
} {
  const scale = useSharedValue(1);
  const down = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };
  const up = () => {
    scale.value = withTiming(1, { duration: 100 });
  };
  return { scale, down, up };
}
