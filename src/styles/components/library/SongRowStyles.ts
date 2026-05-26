import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassBorder,
  },
  active: { backgroundColor: 'rgba(168,85,247,0.12)' },
  art: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
  t: { color: Colors.textPrimary },
  a: { color: Colors.textSecondary },
  d: { color: Colors.textMuted, marginLeft: 8 },
  side: { width: 72, justifyContent: 'center', alignItems: 'center' },
  sideAdd: { backgroundColor: Colors.success },
  artPlaceholder: { backgroundColor: Colors.surfaceElevated },
  meta: { flex: 1 },
  eqIcon: {
    marginRight: 8,
  },
  actionBtn: {
    padding: 8,
    marginRight: 4,
  },
});
