import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { styles } from '../../../styles/components/video/EmbeddedVideoPlayerStyles';
import { Colors } from '../../../theme/colors';
import { BottomSheet } from '../../common/BottomSheet';

interface SceneBookmarksSheetProps {
  visible: boolean;
  onClose: () => void;
  videoBookmarks: { time: number; label: string }[];
  onSeekTo: (sec: number) => void;
  onRemoveBookmark: (time: number) => void;
}

export function SceneBookmarksSheet({
  visible,
  onClose,
  videoBookmarks,
  onSeekTo,
  onRemoveBookmark,
}: SceneBookmarksSheetProps): React.ReactElement {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Scene Bookmarks" heightFraction={0.6}>
      <View style={styles.sheetContainer}>
        {videoBookmarks.length === 0 ? (
          <View style={styles.emptySheetContainer}>
            <MaterialCommunityIcons name="bookmark-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptySheetText}>No scenes bookmarked yet.</Text>
            <Text style={styles.emptySheetDesc}>
              Tap the bookmark icon in bottom controls to save important timestamps!
            </Text>
          </View>
        ) : (
          <FlashList
            data={videoBookmarks}
            estimatedItemSize={56}
            keyExtractor={(b, idx) => `${b.time}-${idx}`}
            renderItem={({ item: b }) => (
              <View style={styles.bookmarkRow}>
                <Pressable
                  onPress={() => {
                    onSeekTo(b.time);
                    onClose();
                  }}
                  style={styles.bookmarkPressable}
                >
                  <MaterialCommunityIcons
                    name="bookmark"
                    size={20}
                    color={Colors.accent2}
                    style={styles.bookmarkIcon}
                  />
                  <Text style={styles.bookmarkText}>{b.label}</Text>
                </Pressable>
                <Pressable onPress={() => onRemoveBookmark(b.time)} hitSlop={12}>
                  <MaterialCommunityIcons name="delete" size={18} color={Colors.danger} />
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </BottomSheet>
  );
}
