import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  clearBtn: { paddingVertical: 8, marginBottom: 8 },
  qRow: { flexDirection: 'row', alignItems: 'center', height: 56 },
  qArt: { width: 32, height: 32, borderRadius: 8, marginRight: 10, backgroundColor: Colors.surface },
  clearText: { color: Colors.danger },
  qArtPlaceholder: { backgroundColor: Colors.surfaceElevated },
  qMeta: { flex: 1 },
  qTitle: { color: Colors.textPrimary },
  qArtist: { color: Colors.textMuted },
  qDuration: { color: Colors.textMuted },
});
