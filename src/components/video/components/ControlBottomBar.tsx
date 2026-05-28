import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { styles } from '../../../styles/components/video/EmbeddedVideoPlayerStyles';
import { Colors } from '../../../theme/colors';
import { formatTime } from '../../../utils/formatTime';

interface ControlBottomBarProps {
  pos: number;
  dur: number;
  prog: number;
  onSeekTo: (sec: number) => void;
  rate: number;
  onCycleRate: () => void;
  isOrientationLocked: boolean;
  onToggleOrientationLock: () => void;
  pipActive: boolean;
  onTogglePip: () => void;
  controlsLocked: boolean;
  onToggleControlsLock: () => void;
}

export function ControlBottomBar({
  pos,
  dur,
  prog,
  onSeekTo,
  rate,
  onCycleRate,
  isOrientationLocked,
  onToggleOrientationLock,
  pipActive,
  onTogglePip,
  controlsLocked,
  onToggleControlsLock,
}: ControlBottomBarProps): React.ReactElement {
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [dragProg, setDragProg] = useState<number | null>(null);
  const widthShared = useSharedValue(0);

  const seekFromX = (x: number) => {
    const w = widthShared.value || progressBarWidth || 1;
    const ratio = Math.max(0, Math.min(1, x / w));
    setDragProg(ratio);
  };

  const commitSeek = (x: number) => {
    const w = widthShared.value || progressBarWidth || 1;
    const ratio = Math.max(0, Math.min(1, x / w));
    setDragProg(null);
    onSeekTo(ratio * dur);
  };

  const tap = Gesture.Tap()
    .maxDuration(220)
    .onEnd((e) => {
      runOnJS(commitSeek)(e.x);
    });

  const pan = Gesture.Pan()
    .minDistance(0)
    .activeOffsetX([-2, 2])
    .onStart((e) => {
      runOnJS(seekFromX)(e.x);
    })
    .onUpdate((e) => {
      runOnJS(seekFromX)(e.x);
    })
    .onEnd((e) => {
      runOnJS(commitSeek)(e.x);
    });

  const composed = Gesture.Race(pan, tap);

  const displayProg = dragProg !== null ? dragProg : prog;

  return (
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.85)']}
      style={styles.bottomBar}
    >
      <GestureDetector gesture={composed}>
        <View
          style={styles.progressTouch}
          onLayout={(e) => {
            setProgressBarWidth(e.nativeEvent.layout.width);
            widthShared.value = e.nativeEvent.layout.width;
          }}
        >
          <View style={styles.track} pointerEvents="none">
            <View style={[styles.played, { width: `${displayProg * 100}%` }]}>
              <LinearGradient
                colors={[Colors.accent1, Colors.accent2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <View style={[styles.thumb, { left: `${displayProg * 100}%` as any }]} />
          </View>
        </View>
      </GestureDetector>

      <View style={styles.bottomControlsRow}>
        <Text style={styles.timeText}>
          {dragProg !== null
            ? `${formatTime(dragProg * dur)} / ${formatTime(dur)}`
            : `${formatTime(pos)} / ${formatTime(dur)}`}
        </Text>

        <View style={styles.bottomRightControls}>
          <Pressable onPress={onCycleRate} hitSlop={12}>
            <Text style={styles.rateText}>{rate}x</Text>
          </Pressable>
          <Pressable onPress={onToggleOrientationLock} hitSlop={12}>
            <MaterialCommunityIcons
              name={isOrientationLocked ? 'screen-rotation-lock' : 'screen-rotation'}
              size={22}
              color={isOrientationLocked ? Colors.accent3 : '#fff'}
            />
          </Pressable>
          <Pressable onPress={onTogglePip} hitSlop={12}>
            <MaterialCommunityIcons
              name={
                pipActive
                  ? 'picture-in-picture-bottom-right'
                  : 'picture-in-picture-bottom-right-outline'
              }
              size={22}
              color={pipActive ? Colors.accent1 : '#fff'}
            />
          </Pressable>
          <Pressable onPress={onToggleControlsLock} hitSlop={12}>
            <MaterialCommunityIcons
              name={controlsLocked ? 'lock' : 'lock-open-variant-outline'}
              size={22}
              color={controlsLocked ? Colors.accent2 : '#fff'}
            />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}
