import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatTime } from '../../utils/formatTime';
import { styles } from '../../styles/components/video/VideoControlsStyles';

type Props = {
  title: string;
  visible: boolean;
  paused: boolean;
  position: number;
  duration: number;
  rate: number;
  resize: 'contain' | 'cover' | 'stretch';
  locked: boolean;
  onBack: () => void;
  onToggle: () => void;
  onSeek: (sec: number) => void;
  onSeekTo?: (sec: number) => void;
  onRate: () => void;
  onResize: () => void;
  onLock: () => void;
  onPip: () => void;
  onSubtitlesPress?: () => void;
};

export function VideoControls({
  title,
  visible,
  paused,
  position,
  duration,
  rate,
  resize,
  locked,
  onBack,
  onToggle,
  onSeek,
  onSeekTo,
  onRate,
  onResize,
  onLock,
  onPip,
  onSubtitlesPress,
}: Props): React.ReactElement | null {
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
      if (onSeekTo) {
        runOnJS(onSeekTo)(ratio * duration);
      }
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
      if (onSeekTo) {
        runOnJS(onSeekTo)(ratio * duration);
      }
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
      transform: [{ scale: withTiming(isDragging.value ? 1.25 : 1, { duration: 150 }) }],
    };
  });

  const composed = Gesture.Exclusive(pan, tap);

  if (!visible) {
    return null;
  }
  if (locked) {
    return (
      <View style={styles.lockedOverlay}>
        <Pressable style={styles.lockedButton} onPress={onLock}>
          <MaterialCommunityIcons name="lock-open-outline" size={24} color="#fff" />
          <Text style={[Typography.caption, styles.lockedText]}>Unlock controls</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.overlay}>
      <View style={styles.top}>
        <Pressable onPress={onBack} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
        </Pressable>
        <Text numberOfLines={1} style={[Typography.subtitle, styles.title]}>
          {title}
        </Text>
        {onSubtitlesPress && (
          <Pressable onPress={onSubtitlesPress} hitSlop={12}>
            <MaterialCommunityIcons
              name="closed-caption"
              size={24}
              color="#fff"
              style={styles.ccIcon}
            />
          </Pressable>
        )}
        <Pressable onPress={() => {}} hitSlop={12}>
          <MaterialCommunityIcons name="dots-vertical" size={22} color="#fff" />
        </Pressable>
      </View>
      <Pressable style={styles.center} onPress={onToggle}>
        <MaterialCommunityIcons name={paused ? 'play' : 'pause'} size={64} color="#fff" />
      </Pressable>
      <View style={styles.bottom}>
        {/* Scrubber */}
        <View style={styles.seekerContainer} onLayout={onLayout}>
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
        </View>

        <Text style={[Typography.caption, styles.time]}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
        <View style={styles.row}>
          <Pressable onPress={() => onSeek(-10)} hitSlop={12}>
            <MaterialCommunityIcons name="rewind-10" size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={() => onSeek(10)} hitSlop={12}>
            <MaterialCommunityIcons name="fast-forward-10" size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={onRate} hitSlop={12}>
            <Text style={[Typography.caption, styles.badge]}>
              {rate}x
            </Text>
          </Pressable>
          <Pressable onPress={onResize} hitSlop={12}>
            <Text style={[Typography.caption, styles.badge]}>
              {resize}
            </Text>
          </Pressable>
          <Pressable onPress={onPip} hitSlop={12}>
            <MaterialCommunityIcons name="picture-in-picture-bottom-right" size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={onLock} hitSlop={12}>
            <MaterialCommunityIcons name="lock-outline" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

