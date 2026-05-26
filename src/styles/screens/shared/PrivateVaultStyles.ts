import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  backText: { color: Colors.accent2, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Poppins-Bold' },
  back: { paddingVertical: 4 },
  title: { color: Colors.textPrimary },
  resetBtn: { padding: 4 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.accent1 },
  tabText: { color: Colors.textMuted },
  activeTabText: { color: Colors.accent1 },
  listWrap: { flex: 1 },
  emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyText: { color: Colors.textMuted },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  songThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: Colors.surface },
  songThumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceElevated },
  songMeta: { flex: 1 },
  songTitle: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  songTitleActive: { color: Colors.accent1 },
  songArtist: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
});

