import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import type { VisualizerStyle } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { styles } from '../../styles/components/common/VisualizerStyles';

type Props = {
  isPlaying: boolean;
  style?: object;
  compact?: boolean;
};

const BAR_COUNT = 16;

export function Visualizer({ isPlaying, style, compact }: Props): React.ReactElement | null {
  const visualizerStyle = useSettingsStore((s) => s.visualizerStyle);
  if (visualizerStyle === 'none') {
    return null;
  }
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: compact ? 8 : BAR_COUNT }).map((_, i) => (
        <Bar key={i} index={i} playing={isPlaying} mode={visualizerStyle} compact={Boolean(compact)} />
      ))}
    </View>
  );
}

function Bar({
  index,
  playing,
  mode,
  compact,
}: {
  index: number;
  playing: boolean;
  mode: VisualizerStyle;
  compact: boolean;
}): React.ReactElement {
  const h = useSharedValue(6);
  useEffect(() => {
    if (!playing) {
      h.value = withTiming(6, { duration: 220 });
      return;
    }
    const base = 10 + (index % 5) * 4;
    const amp = mode === 'particles' ? 18 : 26;
    h.value = withRepeat(
      withSequence(
        withTiming(base + amp, { duration: 280 + index * 18 }),
        withTiming(base, { duration: 260 + index * 12 }),
      ),
      -1,
      false,
    );
  }, [playing, index, h, mode]);
  const styleA = useAnimatedStyle(() => ({
    height: compact ? Math.min(32, h.value) : h.value,
    backgroundColor: Colors.visualizerBars[index % Colors.visualizerBars.length],
    borderRadius: 4,
    opacity: mode === 'wave' ? 0.55 + (h.value % 20) / 40 : 0.95,
  }));
  return <Animated.View style={[styles.bar, styleA]} />;
}

