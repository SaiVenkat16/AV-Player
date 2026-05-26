import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', maxWidth: 160 },
  glow: { textShadowColor: Colors.accent2, textShadowRadius: 8 },
  name: { color: Colors.textSecondary, marginLeft: 4 },
});
