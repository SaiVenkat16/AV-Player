import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.glassBorder,
  },
  thumbWrap: {
    width: 120,
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  thumb: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  durationText: { color: '#fff', fontSize: 10, fontFamily: 'Poppins-Bold' },
  resBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(168,85,247,0.8)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  resText: { color: '#fff', fontSize: 10, fontFamily: 'Poppins-ExtraBold' },
  videoMeta: { flex: 1 },
  videoTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 20,
  },
  videoSubRow: { flexDirection: 'row', marginTop: 4 },
  videoSub: { color: Colors.textMuted, fontSize: 11 },
});

