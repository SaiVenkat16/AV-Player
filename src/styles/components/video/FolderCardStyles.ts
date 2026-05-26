import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  folderCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  folderThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderThumb: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderGradient: {
    ...StyleSheet.absoluteFill,
  },
  countBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  countBadgeText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  folderName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 2,
  },
  folderSub: {
    color: Colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});

