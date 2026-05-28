import React, { useRef } from 'react';
import { Dimensions, Platform, Vibration, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import SystemSetting from 'react-native-system-setting';
import { styles } from '../../styles/components/video/VideoGestureHandlerStyles';

const { width: screenW } = Dimensions.get('window');

type Props = {
  children: React.ReactNode;
  locked: boolean;
  /** When true, suppress pan/double-tap gestures so the controls overlay
   *  receives touches (progress drag, button taps). */
  controlsActive?: boolean;
  onHud: (payload: { icon: string; label: string; bar: number; side?: 'left' | 'right' | 'center' }) => void;
  onDoubleTap: (side: 'left' | 'right') => void;
  onSingleTap: () => void;
};

export function VideoGestureHandler({
  children,
  locked,
  controlsActive = false,
  onHud,
  onDoubleTap,
  onSingleTap,
}: Props): React.ReactElement {
  const startVolume = useRef(0);
  const startBrightness = useRef(0);
  const isLeft = useRef(false);

  const onPanStart = async (x: number) => {
    isLeft.current = x < screenW / 2;
    try {
      if (isLeft.current) {
        startBrightness.current = await SystemSetting.getAppBrightness();
      } else {
        startVolume.current = await SystemSetting.getVolume('music');
      }
    } catch {
      // ignore
    }
  };

  const onPanUpdate = (translationY: number) => {
    const delta = -translationY / 250; // Drag 250px for 100% change
    if (isLeft.current) {
      const nextBrightness = Math.max(0, Math.min(1, startBrightness.current + delta));
      SystemSetting.setAppBrightness(nextBrightness);
      onHud({ icon: 'brightness-6', label: 'Brightness', bar: nextBrightness, side: 'left' });
    } else {
      const nextVolume = Math.max(0, Math.min(1, startVolume.current + delta));
      SystemSetting.setVolume(nextVolume, { type: 'music', showUI: false, playSound: false });
      if (nextVolume <= 0.01 || nextVolume >= 0.99) {
        Vibration.vibrate(Platform.OS === 'ios' ? 10 : 16);
      }
      onHud({ icon: 'volume-high', label: 'Volume', bar: nextVolume, side: 'right' });
    }
  };

  const pan = Gesture.Pan()
    .minDistance(20)
    .activeOffsetY([-12, 12])
    .failOffsetX([-30, 30])
    .onStart((e) => {
      runOnJS(onPanStart)(e.x);
    })
    .onUpdate((e) => {
      runOnJS(onPanUpdate)(e.translationY);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      const side = e.x < screenW / 2 ? 'left' : 'right';
      runOnJS(onDoubleTap)(side);
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(onSingleTap)();
    });

  const noopTap = Gesture.Tap().enabled(false);

  const composed = locked
    ? singleTap
    : controlsActive
    ? noopTap // When controls are visible, let the controls overlay handle taps
    : Gesture.Simultaneous(pan, Gesture.Exclusive(doubleTap, singleTap));

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.fill}>{children}</View>
    </GestureDetector>
  );
}
