import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useToastStore } from '../../store/toastStore';
import { styles } from '../../styles/components/common/ThemedToastStyles';

const TOAST_DURATION_MS = 1800;

/**
 * App-wide toast renderer. Mount once near the root. Anywhere in the app
 * can call `showToast('text')` and the message will appear here.
 */
export function GlobalToast(): React.ReactElement | null {
  const message = useToastStore((s) => s.message);
  const token = useToastStore((s) => s.token);
  const hide = useToastStore((s) => s.hide);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) hide();
      });
    }, TOAST_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // We intentionally re-run on `token` so a rapid second toast restarts the timer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, message]);

  if (!message) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.toast, { opacity }]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}
