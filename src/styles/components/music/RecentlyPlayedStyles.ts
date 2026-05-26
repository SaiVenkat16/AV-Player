import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  sec: { color: Colors.textMuted, marginLeft: 16, marginVertical: 8 },
  recent: { maxHeight: 220, paddingLeft: 12 },
  rcard: {
    width: 160,
    height: 200,
    marginHorizontal: 8,
    borderRadius: 18,
    padding: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  rcardActive: { borderColor: Colors.accent1, shadowColor: Colors.accent1, shadowOpacity: 0.5, shadowRadius: 12 },
  rimg: { flex: 1, borderRadius: 14, marginBottom: 8, backgroundColor: '#111' },
  fallbackArt: { backgroundColor: Colors.surfaceElevated },
  songTitle: { color: Colors.textPrimary },
});
