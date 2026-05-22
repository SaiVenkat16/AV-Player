import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

const styles = StyleSheet.create({
  doubleTapIndicator: {
    position: 'absolute',
    top: '50%',
    marginTop: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  doubleTapLeft: {
    left: '15%',
  },
  doubleTapRight: {
    right: '15%',
  },
  doubleTapText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
