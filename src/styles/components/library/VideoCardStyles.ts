import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  card: { flex: 1, marginBottom: 12 },
  thumbWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  thumb: { width: '100%', height: '100%' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  play: { position: 'absolute', alignSelf: 'center', top: '35%' },
  dur: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  durT: { color: Colors.textPrimary, fontSize: 10, fontFamily: 'Poppins-Bold' },
  title: { color: Colors.textPrimary, marginTop: 10, paddingHorizontal: 4 },
  meta: { color: Colors.textMuted, marginTop: 2, paddingHorizontal: 4 },
});

