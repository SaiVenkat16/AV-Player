import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 68,
    zIndex: 60,
    elevation: 24,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 12,
  },
  gestureView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    gap: 10,
  },
  art: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  artPlaceholder: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  playBtn: {
    marginRight: 4,
  },
});

