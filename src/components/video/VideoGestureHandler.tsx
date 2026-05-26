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
  onHud: (payload: { icon: string; label: string; bar: number }) => void;
  onDoubleTap: (side: 'left' | 'right') => void;
  onSingleTap: () => void;
};

export function VideoGestureHandler({
  children,
  locked,
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
        startBrightness.current = await SystemSetting.getBrightness();
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
      SystemSetting.setBrightness(nextBrightness);
      onHud({ icon: '☀️', label: 'Brightness', bar: nextBrightness });
    } else {
      const nextVolume = Math.max(0, Math.min(1, startVolume.current + delta));
      SystemSetting.setVolume(nextVolume, { type: 'music', showUI: false, playSound: false });
      if (nextVolume <= 0.01 || nextVolume >= 0.99) {
        Vibration.vibrate(Platform.OS === 'ios' ? 10 : 16);
      }
      onHud({ icon: '🔊', label: 'Volume', bar: nextVolume });
    }
  };

  const pan = Gesture.Pan()
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

  const composed = locked
    ? singleTap
    : Gesture.Simultaneous(pan, Gesture.Exclusive(doubleTap, singleTap));

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.fill}>{children}</View>
    </GestureDetector>
  );
}
