import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    elevation: 40,
  },
  wrapLeft: {
    alignItems: 'flex-start',
    paddingLeft: 16,
  },
  wrapRight: {
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  card: {
    width: 120,
    minHeight: 120,
    borderRadius: 22,
    backgroundColor: 'rgba(15,15,26,0.72)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    padding: 12,
  },
  cardSmall: {
    width: 36,
    height: 140,
    borderRadius: 18,
    backgroundColor: 'rgba(15,15,26,0.72)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    paddingVertical: 10,
  },
  icon: { marginBottom: 6 },
  lab: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  track: {
    width: 10,
    height: 100,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  trackSmall: {
    width: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: { width: '100%', backgroundColor: Colors.accent2 },
});
