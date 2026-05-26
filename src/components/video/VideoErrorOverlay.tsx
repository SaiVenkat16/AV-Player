import React from 'react';
import { View, Text } from 'react-native';
import { Typography } from '../../theme/typography';
import { styles } from '../../styles/components/video/VideoErrorOverlayStyles';

interface VideoErrorOverlayProps {
  error: string | null;
}

export const VideoErrorOverlay: React.FC<VideoErrorOverlayProps> = ({ error }) => {
  if (!error) return null;
  return (
    <View style={styles.errorOverlay}>
      <Text style={[Typography.subtitle, styles.errorTitle]}>
        Video preview unavailable
      </Text>
      <Text style={[Typography.caption, styles.errorCopy]}>
        {error}
      </Text>
    </View>
  );
};

