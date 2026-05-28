import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../../../styles/components/video/EmbeddedVideoPlayerStyles';

interface ControlTopBarProps {
  title: string;
  resizeIdx: number;
  onBack: () => void;
  onOpenTracks: () => void;
  onCycleResize: () => void;
}

export function ControlTopBar({
  title,
  resizeIdx,
  onBack,
  onOpenTracks,
  onCycleResize,
}: ControlTopBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const resizeIcons = ['fit-to-screen', 'crop', 'arrow-expand-all'];
  const resizeIconName = resizeIcons[resizeIdx] || 'fit-to-screen';

  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.75)', 'transparent']}
      style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 8 }]}
    >
      <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
        <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
      </Pressable>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={styles.topRightRow}>
        <Pressable onPress={onOpenTracks} hitSlop={12}>
          <MaterialCommunityIcons name="cog-outline" size={22} color="#fff" />
        </Pressable>
        <Pressable onPress={onCycleResize} hitSlop={12}>
          <MaterialCommunityIcons name={resizeIconName} size={22} color="#fff" />
        </Pressable>
      </View>
    </LinearGradient>
  );
}
