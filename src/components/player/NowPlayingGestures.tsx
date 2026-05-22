import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, Vibration, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import SystemSetting from 'react-native-system-setting';
import { usePlayerStore } from '../../store/playerStore';

const { height: SCREEN_H } = Dimensions.get('window');
const VEL = 800;

type Props = {
  children: React.ReactNode;
  onMinimize: () => void;
  onNextVisual: () => void;
  onPrevVisual: () => void;
};

export function NowPlayingGestures({
  children,
  onMinimize,
  onNextVisual,
  onPrevVisual,
}: Props): React.ReactElement {
  const next = usePlayerStore((s) => s.nextSong);
  const prev = usePlayerStore((s) => s.prevSong);
  const startY = useSharedValue(0);
  const [hud, setHud] = useState({ visible: false, text: '', bar: 0 });
  const hideT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showHud = useCallback((text: string, bar: number) => {
    if (hideT.current) {
      clearTimeout(hideT.current);
    }
    setHud({ visible: true, text, bar });
    hideT.current = setTimeout(() => {
      setHud((h) => ({ ...h, visible: false }));
    }, 1500);
  }, []);
  const handleEnd = useCallback(
    (
      sy: number,
      vy: number,
      vx: number,
      tx: number,
      ty: number,
    ) => {
      const bottomZone = sy > SCREEN_H * 0.62;
      const topZone = sy < SCREEN_H * 0.32;
      if (bottomZone && vy < -VEL) {
        onNextVisual();
        next();
        return;
      }
      if (topZone && vy > VEL) {
        onPrevVisual();
        prev();
        return;
      }
      if (Math.abs(vx) > VEL && Math.abs(tx) > 24) {
        (async () => {
          try {
            const cur = await SystemSetting.getVolume('music');
            const dv = -tx / 300;
            const nv = Math.max(0, Math.min(1, cur + dv));
            SystemSetting.setVolume(nv, { type: 'music', showUI: false, playSound: false });
            if (nv <= 0.01 || nv >= 0.99) {
              Vibration.vibrate(Platform.OS === 'ios' ? 10 : 16);
            }
            showHud(`${Math.round(nv * 100)}%`, nv * 120);
          } catch {
            /* volume control unavailable */
          }
        })();
        return;
      }
      if (vy > 1400 && ty > 90) {
        onMinimize();
      }
    },
    [next, onMinimize, onNextVisual, onPrevVisual, prev, showHud],
  );
  const pan = Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      startY.value = e.absoluteY;
    })
    .onEnd((e) => {
      'worklet';
      runOnJS(handleEnd)(startY.value, e.velocityY, e.velocityX, e.translationX, e.translationY);
    });
  return (
    <GestureDetector gesture={pan}>
      <View style={styles.fill}>
        {children}
        {hud.visible ? (
          <View pointerEvents="none" style={styles.hud}>
            <View style={styles.hudInner}>
              <Text style={styles.hudLabel}>{hud.text}</Text>
              <View style={styles.volTrack}>
                <View style={[styles.volFill, { height: hud.bar }]} />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hud: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudInner: {
    width: 120,
    minHeight: 120,
    borderRadius: 22,
    backgroundColor: 'rgba(15,15,26,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  hudLabel: { color: '#F8FAFC', fontSize: 20, fontWeight: '800' },
  volTrack: {
    width: 10,
    height: 120,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  volFill: { width: '100%', backgroundColor: '#06B6D4' },
});
