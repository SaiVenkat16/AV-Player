import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { runOnJS } from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatTime } from '../../utils/formatTime';

type Props = {
  position: number;
  duration: number;
  onSeek: (sec: number) => void;
};

import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function ProgressBar({ position, duration, onSeek }: Props): React.ReactElement {
  const [w, setW] = useState(1);
  const isDragging = useSharedValue(false);
  const dragX = useSharedValue(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setW(Math.max(1, e.nativeEvent.layout.width));
  }, []);

  const prog = duration > 0 ? position / duration : 0;
  
  const tap = Gesture.Tap()
    .onEnd((e) => {
      const ratio = Math.max(0, Math.min(1, e.x / w));
      runOnJS(onSeek)(ratio * duration);
    });

  const pan = Gesture.Pan()
    .onStart((e) => {
      isDragging.value = true;
      dragX.value = e.x;
    })
    .onUpdate((e) => {
      dragX.value = e.x;
    })
    .onEnd(() => {
      isDragging.value = false;
      const ratio = Math.max(0, Math.min(1, dragX.value / w));
      runOnJS(onSeek)(ratio * duration);
    });

  const animatedPlayedStyle = useAnimatedStyle(() => {
    const width = isDragging.value 
      ? Math.max(0, Math.min(1, dragX.value / w)) * 100 
      : prog * 100;
    return {
      width: `${width}%`,
    };
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    const left = isDragging.value 
      ? Math.max(0, Math.min(1, dragX.value / w)) * 100 
      : prog * 100;
    return {
      left: `${left}%`,
      transform: [{ scale: withSpring(isDragging.value ? 1.2 : 1) }],
    };
  });

  const composed = Gesture.Exclusive(pan, tap);

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <GestureDetector gesture={composed}>
        <View style={styles.touchArea}>
          <View style={styles.track}>
            <Animated.View style={[styles.played, animatedPlayedStyle]}>
              <LinearGradient
                colors={[Colors.accent1, Colors.accent2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Animated.View style={[styles.thumb, animatedThumbStyle]}>
            <View style={styles.thumbInner} />
          </Animated.View>
        </View>
      </GestureDetector>
      <View style={styles.times}>
        <Text style={[Typography.caption, styles.tm]}>{formatTime(position)}</Text>
        <Text style={[Typography.caption, styles.tm]}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginVertical: 20 },
  touchArea: {
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  played: {
    height: '100%',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  thumbInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.textPrimary,
    borderWidth: 3,
    borderColor: Colors.accent1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  tm: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
