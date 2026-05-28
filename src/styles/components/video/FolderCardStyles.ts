import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  folderCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 0,
  },
  folderIcon: {
    width: 140,
    height: 140,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  folderInnerIcon: {
    position: 'absolute',
  },
  folderName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  folderSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
});
