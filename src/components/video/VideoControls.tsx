import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatTime } from '../../utils/formatTime';

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
      transform: [{ scale: withSpring(isDragging.value ? 1.25 : 1) }],
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
        <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" onPress={onBack} />
        <Text numberOfLines={1} style={[Typography.subtitle, styles.title]}>
          {title}
        </Text>
        {onSubtitlesPress && (
          <MaterialCommunityIcons
            name="closed-caption"
            size={24}
            color="#fff"
            style={styles.ccIcon}
            onPress={onSubtitlesPress}
          />
        )}
        <MaterialCommunityIcons name="dots-vertical" size={22} color="#fff" onPress={() => {}} />
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
          <MaterialCommunityIcons name="rewind-10" size={22} color="#fff" onPress={() => onSeek(-10)} />
          <MaterialCommunityIcons name="fast-forward-10" size={22} color="#fff" onPress={() => onSeek(10)} />
          <Text style={[Typography.caption, styles.badge]} onPress={onRate}>
            {rate}x
          </Text>
          <Text style={[Typography.caption, styles.badge]} onPress={onResize}>
            {resize}
          </Text>
          <MaterialCommunityIcons name="picture-in-picture-bottom-right" size={22} color="#fff" onPress={onPip} />
          <MaterialCommunityIcons name="lock-outline" size={22} color="#fff" onPress={onLock} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    zIndex: 50,
    elevation: 50,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 36,
    zIndex: 50,
    elevation: 50,
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  lockedText: { color: '#fff', marginLeft: 8 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  ccIcon: {
    marginRight: 16,
  },
  title: { color: '#fff', flex: 1, marginHorizontal: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { padding: 12, backgroundColor: 'rgba(0,0,0,0.45)' },
  time: { color: '#e2e8f0', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { color: Colors.accent2, paddingHorizontal: 8 },
  seekerContainer: {
    width: '100%',
    marginBottom: 8,
  },
  touchArea: {
    height: 24,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  played: {
    height: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  thumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.accent1,
  },
});
