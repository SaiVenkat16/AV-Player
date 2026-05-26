import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  backButton: {
    paddingVertical: 4,
    marginRight: 12,
  },
  backButtonText: {
    color: Colors.accent2,
    fontSize: 16,
  },
  title: {
    color: Colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent1,
  },
  tabText: {
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.accent1,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gridContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  videoCardWrapper: {
    flex: 0.5,
    marginHorizontal: 8,
    marginTop: 16,
  },
  emptyView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
