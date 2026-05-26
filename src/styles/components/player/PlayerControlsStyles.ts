import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 8,
  },
  side: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  play: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent1,
    shadowColor: Colors.accent1,
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 8,
  },
});
