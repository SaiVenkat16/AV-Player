import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  fullArt: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullArtImage: {
    borderRadius: 30,
  },
  heartButtonCorner: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    zIndex: 10,
  },
  playButtonCorner: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    zIndex: 10,
  },
  // Vinyl CD styles
  vinyl: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignSelf: 'center',
    top: '50%',
    marginTop: -110,
  },
  vinylDisc: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  groove1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  groove2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  vinylCenter: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
