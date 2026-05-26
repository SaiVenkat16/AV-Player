import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { styles } from '../../../styles/components/video/EmbeddedVideoPlayerStyles';
import { Colors } from '../../../theme/colors';
import { BottomSheet } from '../../common/BottomSheet';

interface AudioTrackSheetProps {
  visible: boolean;
  onClose: () => void;
  audioTracks: { index: number; title?: string; language?: string }[];
  selectedAudioTrackIdx: number;
  onSelectTrack: (index: number) => void;
}

export function AudioTrackSheet({
  visible,
  onClose,
  audioTracks,
  selectedAudioTrackIdx,
  onSelectTrack,
}: AudioTrackSheetProps): React.ReactElement {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Audio Language" heightFraction={0.5}>
      <View style={styles.sheetContainer}>
        {audioTracks.length === 0 ? (
          <View style={styles.emptySheetContainer}>
            <MaterialCommunityIcons name="volume-mute" size={48} color={Colors.textMuted} />
            <Text style={styles.emptySheetText}>No multiple audio tracks found.</Text>
          </View>
        ) : (
          <FlashList
            data={audioTracks}
            estimatedItemSize={56}
            keyExtractor={(t) => String(t.index)}
            renderItem={({ item: t }) => (
              <View style={styles.audioTrackRow}>
                <Pressable
                  onPress={() => {
                    onSelectTrack(t.index);
                    onClose();
                  }}
                  style={styles.audioTrackPressable}
                >
                  <MaterialCommunityIcons
                    name={selectedAudioTrackIdx === t.index ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={selectedAudioTrackIdx === t.index ? Colors.accent2 : '#fff'}
                    style={styles.audioTrackIcon}
                  />
                  <Text
                    style={[
                      styles.audioTrackText,
                      selectedAudioTrackIdx === t.index && styles.activeAudioTrackText,
                    ]}
                  >
                    {t.title || t.language || `Track ${t.index + 1}`}
                  </Text>
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </BottomSheet>
  );
}
