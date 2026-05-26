import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomSheet } from '../common/BottomSheet';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { styles } from '../../styles/components/video/SubtitleSheetStyles';


interface SubtitleTrack {
  title: string;
  language?: string;
  type?: string;
  uri?: string;
  index?: number;
}

interface SubtitleSheetProps {
  visible: boolean;
  onClose: () => void;
  tracks: SubtitleTrack[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function SubtitleSheet({
  visible,
  onClose,
  tracks,
  selectedIndex,
  onSelect,
}: SubtitleSheetProps): React.ReactElement {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Subtitles & Audio CC" heightFraction={0.5}>
      <View style={styles.container}>
        {/* Disable Subtitles Row */}
        <Pressable
          onPress={() => {
            onSelect(-1);
            onClose();
          }}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <MaterialCommunityIcons
            name="closed-caption-off"
            size={24}
            color={selectedIndex === -1 ? Colors.accent1 : Colors.textMuted}
            style={styles.icon}
          />
          <Text style={[Typography.body, styles.label, selectedIndex === -1 && styles.labelActive]}>
            Disable Subtitles
          </Text>
          {selectedIndex === -1 && (
            <MaterialCommunityIcons name="check" size={22} color={Colors.accent1} />
          )}
        </Pressable>

        {tracks.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="closed-caption-outline" size={40} color={Colors.textMuted} />
            <Text style={[Typography.caption, styles.emptyText]}>
              No subtitle tracks found
            </Text>
          </View>
        ) : (
          <FlashList
            data={tracks}
            estimatedItemSize={56}
            keyExtractor={(item, index) => `${item.uri || item.index || index}`}
            renderItem={({ item, index }) => {
              const active = selectedIndex === index;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(index);
                    onClose();
                  }}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <MaterialCommunityIcons
                    name="closed-caption"
                    size={24}
                    color={active ? Colors.accent1 : Colors.textSecondary}
                    style={styles.icon}
                  />
                  <View style={styles.meta}>
                    <Text style={[Typography.subtitle, styles.title, active && styles.labelActive]}>
                      {item.title}
                    </Text>
                    {item.language ? (
                      <Text style={[Typography.caption, styles.lang]}>
                        Language: {item.language} {item.type ? `(${item.type})` : ''}
                      </Text>
                    ) : null}
                  </View>
                  {active && (
                    <MaterialCommunityIcons name="check" size={22} color={Colors.accent1} />
                  )}
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </BottomSheet>
  );
}

