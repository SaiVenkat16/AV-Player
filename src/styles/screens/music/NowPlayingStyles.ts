import { Dimensions, StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const ART_SIZE = SCREEN_W - 40;

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  emptyText: { color: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    opacity: 0.8,
  },
  headerSpacer: {
    width: 30,
  },
  gestureWrap: {
    flex: 1,
  },

  // Album art
  artContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    position: 'relative',
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
  },
  artPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartOnArt: {
    position: 'absolute',
    top: 16,
    right: 36,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOnArt: {
    position: 'absolute',
    bottom: 16,
    right: 36,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Song info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 24,
  },
  infoText: { flex: 1 },
  title: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins-ExtraBold',
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    marginTop: 4,
  },

  // Progress
  progressWrap: {
    paddingHorizontal: 24,
    marginTop: 7,
  },

  // Playback controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    marginTop: 40,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Options row (middle)
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginTop: 24,
  },

  // Sleep Timer Modal (centered)
  sleepBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sleepModal: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  sleepTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontFamily: 'Poppins-ExtraBold',
    marginBottom: 6,
  },
  sleepInfo: {
    color: Colors.accent1,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 20,
  },
  sleepChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sleepChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    minWidth: 60,
    alignItems: 'center',
  },
  sleepChipText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  sleepEndRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    width: '100%',
  },
  sleepEndInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sleepCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  sleepCheckboxOn: {
    backgroundColor: Colors.accent1,
    borderColor: Colors.accent1,
  },
  sleepEndText: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  sleepClearBtn: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    width: '100%',
    alignItems: 'center',
  },
  sleepClearText: {
    color: Colors.danger,
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
});

