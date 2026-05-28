import React from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import type { Video } from '../../types';
import { toImageSource } from '../../utils/mediaUri';
import { formatTime } from '../../utils/formatTime';
import { styles } from '../../styles/screens/video/VideoTabStyles';

export interface ContinueWatchingItem {
  video: Video;
  position: number;
  duration: number;
  watchedAt: number;
}

interface Props {
  items: ContinueWatchingItem[];
  onOpen: (videoId: string) => void;
  onRemove: (videoId: string) => void;
}

export function ContinueWatchingRow({
  items,
  onOpen,
  onRemove,
}: Props): React.ReactElement | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.continueSection}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Continue Watching</Text>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={(it) => it.video.id}
        contentContainerStyle={styles.continueListContent}
        renderItem={({ item }) => {
          const remaining = Math.max(0, item.duration - item.position);
          const progress = item.duration > 0 ? item.position / item.duration : 0;
          return (
            <Pressable
              style={styles.continueCard}
              onPress={() => onOpen(item.video.id)}
              android_ripple={{ color: 'rgba(255,255,255,0.07)' }}
            >
              <View style={styles.continueThumbWrap}>
                {item.video.thumbnailUri ? (
                  <Image
                    source={toImageSource(item.video.thumbnailUri)}
                    style={styles.continueThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={['#1a1a35', '#0d0d1f']}
                    style={styles.continueThumb}
                  >
                    <MaterialCommunityIcons
                      name="play-circle"
                      size={36}
                      color={Colors.accent1}
                    />
                  </LinearGradient>
                )}
                <View style={styles.continueRemainingPill}>
                  <Text style={styles.continueRemainingText}>
                    {formatTime(remaining)} left
                  </Text>
                </View>
                <View style={styles.continueProgressBar}>
                  <View
                    style={[
                      styles.continueProgressFill,
                      { width: `${Math.min(100, Math.max(0, progress * 100))}%` },
                    ]}
                  />
                </View>
                <Pressable
                  onPress={() => onRemove(item.video.id)}
                  style={styles.clearBtn}
                  hitSlop={12}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={18}
                    color="rgba(255,255,255,0.7)"
                  />
                </Pressable>
              </View>
              <View style={styles.continueInfo}>
                <Text numberOfLines={1} style={styles.continueTitle}>
                  {item.video.title}
                </Text>
                <Text style={styles.continueSubtitle}>
                  {Math.round(progress * 100)}% watched
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
