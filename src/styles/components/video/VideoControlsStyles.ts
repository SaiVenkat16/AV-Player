import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    zIndex: 50,
    elevation: 50,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 36,
    zIndex: 50,
    elevation: 50,
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  lockedText: { color: '#fff', marginLeft: 8 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  ccIcon: {
    marginRight: 16,
  },
  title: { color: '#fff', flex: 1, marginHorizontal: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { padding: 12, backgroundColor: 'rgba(0,0,0,0.45)' },
  time: { color: '#e2e8f0', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { color: Colors.accent2, paddingHorizontal: 8 },
  seekerContainer: {
    width: '100%',
    marginBottom: 8,
  },
  touchArea: {
    height: 24,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  played: {
    height: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  thumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.accent1,
  },
});
