import React, { useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  heightFraction?: number;
  children: React.ReactNode;
  style?: ViewStyle;
};

const { height: SCREEN_H } = Dimensions.get('window');

export function BottomSheet({
  visible,
  onClose,
  title,
  heightFraction = 0.55,
  children,
  style,
}: Props): React.ReactElement {
  const translateY = useSharedValue(SCREEN_H);
  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : SCREEN_H, { damping: 22, stiffness: 220 });
  }, [visible, translateY]);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.back}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: SCREEN_H * heightFraction },
            sheetStyle,
            style,
          ]}>
          <View style={styles.handle} />
          {title ? <Text style={[Typography.title, styles.title]}>{title}</Text> : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  back: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginVertical: 10,
  },
  title: { color: Colors.textPrimary, marginBottom: 8 },
});
