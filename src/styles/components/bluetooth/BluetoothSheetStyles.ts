import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  refresh: { alignSelf: 'flex-end', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassBorder,
  },
  dot: { marginLeft: 8 },
  refreshText: { color: Colors.accent2 },
  listContent: { paddingBottom: 24 },
  meta: { flex: 1, marginLeft: 10 },
  name: { color: Colors.textPrimary },
  status: { color: Colors.textMuted },
  dotText: { color: Colors.success },
});
