import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { GradientText } from './GradientText';
import { styles } from '../../styles/components/navigation/QuickMenuSheetStyles';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_W * 0.75;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: 'favorites' | 'vault') => void;
};

export function QuickMenuSheet({
  visible,
  onClose,
  onSelectOption,
}: Props): React.ReactElement {
  const [mounted, setMounted] = useState(visible);
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateX.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(0.6, { duration: 250 });
    } else if (mounted) {
      translateX.value = withTiming(-DRAWER_WIDTH, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      }, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      });
      opacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible, mounted, translateX, opacity]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const options = [
    {
      key: 'favorites' as const,
      label: 'Favorites',
      icon: 'heart-outline',
      color: Colors.danger,
    },
    {
      key: 'vault' as const,
      label: 'Private Vault',
      icon: 'shield-lock-outline',
      color: Colors.accent3,
    },
  ];

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Animated dark backdrop */}
        <Animated.View style={[styles.backdropFill, animatedBackdropStyle]}>
          <Pressable style={styles.backdropPressable} onPress={onClose} />
        </Animated.View>

        {/* Slide-out Drawer Panel */}
        <Animated.View style={[styles.drawer, animatedDrawerStyle]}>
          <View style={styles.drawerHeader}>
            <GradientText style={[Typography.hero, styles.drawerTitle]}>
              AV PLAYER
            </GradientText>
          </View>

          <View style={styles.container}>
            {options.map((item) => (
              <Pressable
                key={item.key}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => {
                  onClose();
                  // Short delay to let drawer start animating out before taking action
                  setTimeout(() => {
                    onSelectOption(item.key);
                  }, 200);
                }}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={[Typography.subtitle, styles.label]}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={[Typography.caption, styles.footerText]}>
              Version 1.0.0
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
