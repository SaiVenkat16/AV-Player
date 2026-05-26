import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  outer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glassWhite,
  },
  inner: { padding: 12 },
  absoluteFill: {
    ...StyleSheet.absoluteFill,
  },
});
