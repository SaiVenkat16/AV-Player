import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent1,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  list: {
    paddingVertical: 4,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowActive: {
    backgroundColor: 'rgba(168,85,247,0.10)',
  },
  iconCol: {
    width: 22,
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  titleActive: {
    color: Colors.accent1,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
});
