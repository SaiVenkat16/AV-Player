import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  wrap: { width: '100%', marginVertical: 20 },
  touchArea: {
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  played: {
    height: '100%',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  thumbInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.textPrimary,
    borderWidth: 3,
    borderColor: Colors.accent1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  tm: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
});

