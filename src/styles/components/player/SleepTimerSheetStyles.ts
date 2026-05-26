import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  sleepChip: {
    padding: 10,
    margin: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.surface,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: Colors.textSecondary },
  checkboxOn: { backgroundColor: Colors.accent1, borderColor: Colors.accent1 },
  info: { color: Colors.textSecondary },
  chipText: { color: Colors.textPrimary },
  toggleLabel: { color: Colors.textPrimary, marginLeft: 12 },
  clearRow: { marginTop: 18, alignSelf: 'flex-start' },
  clearText: { color: Colors.danger },
});
