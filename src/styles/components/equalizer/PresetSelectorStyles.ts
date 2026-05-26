import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  row: { paddingVertical: 8, gap: 8 },
  chip: { marginRight: 8, borderRadius: 16, overflow: 'hidden' },
  grad: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  tOn: { color: Colors.textPrimary, fontFamily: 'Poppins-Bold' },
  tOff: {
    color: Colors.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
});

