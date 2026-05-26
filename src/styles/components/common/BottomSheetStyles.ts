import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  back: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginVertical: 10,
  },
  title: { color: Colors.textPrimary, marginBottom: 8 },
  absoluteFill: {
    ...StyleSheet.absoluteFill,
  },
});
