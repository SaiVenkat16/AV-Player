import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  t: { color: Colors.textPrimary, marginLeft: 16, marginTop: 8 },
  notFoundText: { color: Colors.textSecondary },
  backLinkText: { color: Colors.accent2, marginTop: 12 },
  backButton: { padding: 16 },
  backButtonText: { color: Colors.accent2 },
});
