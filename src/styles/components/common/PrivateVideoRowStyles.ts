import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.glassBorder,
  },
  thumbWrap: {
    width: 110,
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
  },
  meta: { flex: 1 },
  title: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 20,
  },
  sub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  restoreBtn: { padding: 4 },
});
