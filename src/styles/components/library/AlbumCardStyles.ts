import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  card: { flex: 1, margin: 8 },
  art: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  t: { color: Colors.textPrimary, fontFamily: 'Poppins-Bold' },
  c: { color: Colors.textMuted, marginTop: 2 },
});

