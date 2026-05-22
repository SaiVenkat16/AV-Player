import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  locked: boolean;
  children: React.ReactNode;
  onHud: (payload: { icon: string; label: string; bar: number }) => void;
};

// Volume/brightness gestures removed — will be re-implemented later
export function VideoGestureHandler({ children }: Props): React.ReactElement {
  return <View style={styles.fill}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
});
