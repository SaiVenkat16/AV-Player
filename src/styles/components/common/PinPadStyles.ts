import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  backButton: { position: 'absolute', top: 16, left: 16, zIndex: 10 },
  backText: { color: Colors.accent2, fontSize: 16 },
  pinWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 40,
  },
  pinTitle: { color: Colors.textPrimary, marginTop: 12 },
  pinSubtitle: { color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 16, marginVertical: 32 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dotFilled: { backgroundColor: Colors.accent1, borderColor: Colors.accent1 },
  padGrid: {
    width: '100%',
    maxWidth: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  padBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  padBtnPressed: { backgroundColor: 'rgba(255,255,255,0.1)' },
  padBtnText: { color: '#fff', fontSize: 24, fontFamily: 'Poppins-SemiBold' },
  padBtnDummy: { width: 72, height: 72 },
});

