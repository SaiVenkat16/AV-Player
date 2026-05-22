import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface VideoPosterProps {
  source: any;
  visible: boolean;
}

export const VideoPoster: React.FC<VideoPosterProps> = ({ source, visible }) => {
  if (!visible || !source) return null;
  return (
    <Image
      source={source}
      style={styles.poster}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  poster: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
});
