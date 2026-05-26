import { Dimensions, StyleSheet } from 'react-native';

const W = Dimensions.get('window').width;

export const styles = StyleSheet.create({
  wrap: { height: 320, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  artCard: {
    width: 300,
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#A855F7',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  img: { width: '100%', height: '100%' },
  vinyl: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    left: W / 2 - 150 + 26,
    top: 10,
    opacity: 0.55,
    zIndex: 0,
  },
  vinylInner: { flex: 1, borderRadius: 150 },
});
