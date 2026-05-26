import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';
import { Typography } from '../../../theme/typography';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    ...Typography.body,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 17,
  },
  activeTab: {
    backgroundColor: Colors.glassBorder,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },
  activeTabText: {
    color: Colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  sectionLink: {
    color: Colors.accent2,
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  horizontalScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  horizontalVideoCard: {
    width: 170,
    marginRight: 12,
  },
  emptyView: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
  gridContent: {
    paddingHorizontal: 8,
  },
  videoCardWrapper: {
    flex: 0.5,
    marginHorizontal: 8,
    marginTop: 12,
  },
  audiosListWrapper: {
    paddingHorizontal: 16,
  },
  audioListContent: {
    paddingHorizontal: 16,
  },
});

