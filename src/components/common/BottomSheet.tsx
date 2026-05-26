import React, { useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Typography } from '../../theme/typography';
import { styles } from '../../styles/components/common/BottomSheetStyles';

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
    translateY.value = withTiming(visible ? 0 : SCREEN_H, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, translateY]);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.back}>
        <Pressable style={styles.absoluteFill} onPress={onClose} />
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

