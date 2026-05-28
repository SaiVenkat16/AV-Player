import React from 'react';
import { Image } from 'react-native';
import { styles } from '../../styles/components/video/VideoPosterStyles';

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
      resizeMode="contain"
    />
  );
};

