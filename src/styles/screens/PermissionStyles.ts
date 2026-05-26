import { StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  root: { flex: 1, padding: 24, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 24 },
  img: {
    width: 160,
    height: 160,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  title: { color: Colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  sub: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 28 },
  btnWrap: { alignSelf: 'stretch' },
  btn: { borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  btnT: { color: Colors.textPrimary },
});
