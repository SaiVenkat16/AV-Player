import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../../theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_W * 0.75;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdropFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: SCREEN_H,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.glassBorder,
    paddingTop: 48, // Safe area padding
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-ExtraBold',
    letterSpacing: 1.5,
  },
  container: {
    paddingHorizontal: 12,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 14,
    backgroundColor: Colors.glassWhite,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  rowPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  label: {
    flex: 1,
    color: Colors.textPrimary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  footerText: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

