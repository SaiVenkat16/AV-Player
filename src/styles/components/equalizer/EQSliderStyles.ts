import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  col: { alignItems: 'center', width: 56 },
  lb: { color: Colors.textMuted, marginBottom: 6 },
  trackWrap: {
    height: 160,
    width: 14,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: Colors.surface,
  },
  track: { flex: 1, width: '100%' },
  knob: {
    position: 'absolute',
    left: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textPrimary,
    shadowColor: Colors.accent1,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  val: { color: Colors.textSecondary, marginTop: 6 },
});
