import React from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GradientText } from '../common/GradientText';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { styles } from '../../styles/components/music/MusicHeaderStyles';

interface MusicHeaderProps {
  onSearchPress: () => void;
}

export function MusicHeader({
  onSearchPress,
}: MusicHeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerLeft}>
        <GradientText style={Typography.hero}>Audios</GradientText>
      </View>

      <View style={styles.headerRight}>
        <Pressable
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            onSearchPress();
          }}
          hitSlop={16}
          style={styles.icon}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={Colors.textPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}
