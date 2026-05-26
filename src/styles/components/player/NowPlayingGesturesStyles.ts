import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  fill: { flex: 1 },
  hud: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudInner: {
    width: 120,
    minHeight: 120,
    borderRadius: 22,
    backgroundColor: 'rgba(15,15,26,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  hudLabel: { color: '#F8FAFC', fontSize: 20, fontFamily: 'Poppins-ExtraBold' },
  volTrack: {
    width: 10,
    height: 120,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  volFill: { width: '100%', backgroundColor: '#06B6D4' },
});

