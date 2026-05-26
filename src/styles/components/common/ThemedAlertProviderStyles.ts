import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';
import { Spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.xl,
  },
  title: { color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  message: { color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  actions: { gap: Spacing.sm },
  actionsCol: { flexDirection: 'column' },
  actionsRow: { flexDirection: 'row', gap: Spacing.md },
  btnBase: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnFlex: { flex: 1 },
  btnGhost: {
    backgroundColor: Colors.glassWhite,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  btnPrimaryWrap: { overflow: 'hidden', borderRadius: 16 },
  btnPrimary: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
});
