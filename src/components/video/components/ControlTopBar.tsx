import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { styles } from '../../../styles/components/video/EmbeddedVideoPlayerStyles';

interface ControlTopBarProps {
  title: string;
  resizeIdx: number;
  onBack: () => void;
  onOpenScenes: () => void;
  onOpenAudio: () => void;
  onOpenSubtitles: () => void;
  onCycleResize: () => void;
}

export function ControlTopBar({
  title,
  resizeIdx,
  onBack,
  onOpenScenes,
  onOpenAudio,
  onOpenSubtitles,
  onCycleResize,
}: ControlTopBarProps): React.ReactElement {
  const resizeIcons = ['fit-to-screen', 'crop', 'arrow-expand-all'];
  const resizeIconName = resizeIcons[resizeIdx] || 'fit-to-screen';

  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.75)', 'transparent']}
      style={styles.topBar}
    >
      <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
        <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
      </Pressable>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={styles.topRightRow}>
        <Pressable onPress={onOpenScenes} hitSlop={12}>
          <MaterialCommunityIcons name="bookmark-multiple" size={22} color="#fff" />
        </Pressable>
        <Pressable onPress={onOpenAudio} hitSlop={12}>
          <MaterialCommunityIcons name="volume-high" size={22} color="#fff" />
        </Pressable>
        <Pressable onPress={onOpenSubtitles} hitSlop={12}>
          <MaterialCommunityIcons name="closed-caption" size={22} color="#fff" />
        </Pressable>
        <Pressable onPress={onCycleResize} hitSlop={12}>
          <MaterialCommunityIcons name={resizeIconName} size={22} color="#fff" />
        </Pressable>
      </View>
    </LinearGradient>
  );
}
