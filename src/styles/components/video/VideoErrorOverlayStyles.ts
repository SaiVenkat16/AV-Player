import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
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
