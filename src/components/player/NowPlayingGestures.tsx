import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, Text, Vibration, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import SystemSetting from 'react-native-system-setting';
import { usePlayerStore } from '../../store/playerStore';
import { styles } from '../../styles/components/player/NowPlayingGesturesStyles';

const { height: screenH } = Dimensions.get('window');

type Props = {
  children: React.ReactNode;
  onMinimize: () => void;
  songId?: string;
};

export function NowPlayingGestures({
  children,
  onMinimize,
  songId,
}: Props): React.ReactElement {
  const next = usePlayerStore((s) => s.nextSong);
  const prev = usePlayerStore((s) => s.prevSong);

  const translateY = useSharedValue(0);
  const startVolume = useRef(0);
  const lastSongId = useRef(songId);

  const [hud, setHud] = useState({ visible: false, text: '', bar: 0 });
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHud = useCallback((text: string, bar: number) => {
    if (hudTimer.current) clearTimeout(hudTimer.current);
    setHud({ visible: true, text, bar });
    hudTimer.current = setTimeout(() => {
      setHud((h) => ({ ...h, visible: false }));
    }, 1500);
  }, []);

  useEffect(() => {
    if (songId !== lastSongId.current) {
      lastSongId.current = songId;
      translateY.value = withTiming(0, { duration: 250 });
    }
  }, [songId, translateY]);

  const onPanStart = async () => {
    try {
      startVolume.current = await SystemSetting.getVolume('music');
    } catch {
      // ignore
    }
  };

  const onPanUpdate = (translationX: number, translationY: number) => {
    // If vertical movement is dominant, do translate slide animation
    if (Math.abs(translationY) > Math.abs(translationX)) {
      translateY.value = translationY;
    } else {
      // Horizontal swipe controls volume
      const delta = -translationX / 300;
      const nextVol = Math.max(0, Math.min(1, startVolume.current + delta));
      SystemSetting.setVolume(nextVol, { type: 'music', showUI: false, playSound: false });
      if (nextVol <= 0.01 || nextVol >= 0.99) {
        Vibration.vibrate(Platform.OS === 'ios' ? 10 : 16);
      }
      showHud(`${Math.round(nextVol * 100)}%`, nextVol * 100);
    }
  };

  const onPanEnd = (velocityY: number, translationY: number) => {
    if (translationY < -120 || velocityY < -800) {
      // Swipe Up -> Next
      translateY.value = withTiming(-screenH, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(next)();
          translateY.value = screenH;
        }
      });
    } else if (translationY > 120 || velocityY > 800) {
      // Swipe Down -> Prev or Minimize
      if (velocityY > 1500) {
        runOnJS(onMinimize)();
        translateY.value = withTiming(0, { duration: 250 });
      } else {
        translateY.value = withTiming(screenH, { duration: 250 }, (finished) => {
          if (finished) {
            runOnJS(prev)();
            translateY.value = -screenH;
          }
        });
      }
    } else {
      translateY.value = withTiming(0, { duration: 250 });
    }
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      runOnJS(onPanStart)();
    })
    .onUpdate((e) => {
      runOnJS(onPanUpdate)(e.translationX, e.translationY);
    })
    .onEnd((e) => {
      runOnJS(onPanEnd)(e.velocityY, e.translationY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1 - Math.abs(translateY.value) / 1000,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.fill, animatedStyle]}>
        {children}
        {hud.visible && (
          <View pointerEvents="none" style={styles.hud}>
            <View style={styles.hudInner}>
              <Text style={styles.hudLabel}>{hud.text}</Text>
              <View style={styles.volTrack}>
                <View style={[styles.volFill, { height: hud.bar }]} />
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}
