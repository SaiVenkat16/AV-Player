import React from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../../styles/components/video/DoubleTapSeekOverlayStyles';


interface DoubleTapSeekOverlayProps {
  side: 'left' | 'right' | null;
  times: number;
}

export const DoubleTapSeekOverlay: React.FC<DoubleTapSeekOverlayProps> = ({ side, times }) => {
  if (!side) return null;
  const isLeft = side === 'left';
  return (
    <View style={[styles.doubleTapIndicator, isLeft ? styles.doubleTapLeft : styles.doubleTapRight]}>
      <MaterialCommunityIcons name={isLeft ? 'rewind' : 'fast-forward'} size={32} color="#fff" />
      <Text style={styles.doubleTapText}>
        {isLeft ? '-' : '+'}{times * 10}s
      </Text>
    </View>
  );
};

