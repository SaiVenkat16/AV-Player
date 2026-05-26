import { StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
    paddingBottom: 12,
  },
  /* Row 1: App name + menu */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  titleSpacer: {
    width: 38,
  },
  appName: {
    fontSize: 22,
    fontFamily: 'Poppins-ExtraBold',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.glassWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Row 2: Segmented tabs */
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 4,
  },
  /* Active tab - takes 3/4 width, has search icon */
  largeTabPill: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  largeTabText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  /* Inactive tab - takes 1/4 width */
  smallTabPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  smallTabText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  /* Inline search bar (expanded) */
  searchInputBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingVertical: 4,
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glassWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

