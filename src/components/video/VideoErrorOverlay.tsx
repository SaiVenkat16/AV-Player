import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

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

const styles = StyleSheet.create({
  errorOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 92,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    zIndex: 30,
  },
  errorTitle: { color: Colors.textPrimary },
  errorCopy: { color: Colors.textSecondary, marginTop: 4 },
});
