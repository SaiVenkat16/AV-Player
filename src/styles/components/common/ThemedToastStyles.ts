import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    elevation: 100,
  },
  toast: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.glassBorder,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    maxWidth: '88%',
  },
  text: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
});
