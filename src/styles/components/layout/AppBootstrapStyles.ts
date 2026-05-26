import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: Colors.background },
  scan: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  scanInner: { paddingHorizontal: 16 },
  lottie: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTitle: { color: Colors.textPrimary, marginTop: 12 },
  scanCount: { color: Colors.textSecondary, marginTop: 6 },
  skeletonContainer: { width: '80%', marginTop: 24, gap: 12 },
});
