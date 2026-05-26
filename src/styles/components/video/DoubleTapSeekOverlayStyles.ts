import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  doubleTapIndicator: {
    position: 'absolute',
    top: '50%',
    marginTop: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  doubleTapLeft: {
    left: '15%',
  },
  doubleTapRight: {
    right: '15%',
  },
  doubleTapText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

