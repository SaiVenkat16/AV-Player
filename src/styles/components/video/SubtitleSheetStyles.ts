import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassBorder,
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  icon: { marginRight: 14 },
  label: { color: Colors.textSecondary, flex: 1 },
  labelActive: { color: Colors.accent1, fontFamily: 'Poppins-Bold' },
  meta: { flex: 1 },
  title: { color: Colors.textPrimary },
  lang: { color: Colors.textMuted, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: Colors.textMuted },
});

