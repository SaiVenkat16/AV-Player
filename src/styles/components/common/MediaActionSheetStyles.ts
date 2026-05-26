import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
    marginBottom: 12,
  },
  headerArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  headerSub: {
    color: Colors.textSecondary,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 3,
  },
  optionPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    marginLeft: 14,
    flex: 1,
    color: Colors.textPrimary,
  },
  sheetContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
