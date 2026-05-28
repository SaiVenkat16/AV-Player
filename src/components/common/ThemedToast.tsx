import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { styles } from '../../styles/components/common/ThemedToastStyles';

interface ThemedToastProps {
  message: string | null;
  duration?: number;
  onHide?: () => void;
}

export function ThemedToast({
  message,
  duration = 1800,
  onHide,
}: ThemedToastProps): React.ReactElement | null {
  const opacity = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(false);
  const onHideRef = useRef(onHide);
  useEffect(() => {
    onHideRef.current = onHide;
  });

  useEffect(() => {
    if (!message) return;
    setShown(true);
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShown(false);
          onHideRef.current?.();
        }
      });
    }, duration);

    return () => clearTimeout(t);
  }, [message, duration, opacity]);

  if (!shown || !message) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.toast, { opacity }]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}
