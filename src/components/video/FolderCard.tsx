import React from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import type { Video } from '../../types';
import { toImageSource } from '../../utils/mediaUri';
import { styles } from '../../styles/components/video/FolderCardStyles';

export interface VideoFolder {
  folderPath: string;
  folderName: string;
  videos: Video[];
  coverUri: string | null;
}

interface FolderCardProps {
  folder: VideoFolder;
  onPress: () => void;
  cardWidth: number;
}

export function FolderCard({
  folder,
  onPress,
  cardWidth,
}: FolderCardProps): React.ReactElement {
  return (
    <Pressable
      style={[styles.folderCard, { width: cardWidth }]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>
      <View style={styles.folderThumbWrap}>
        {folder.coverUri ? (
          <Image
            source={toImageSource(folder.coverUri)}
            style={styles.folderThumb}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#1e1e3a', '#12122a']}
            style={styles.folderThumb}>
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={40}
              color={Colors.accent1}
            />
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.folderGradient}
        />
        {/* Video count badge */}
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{folder.videos.length}</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.folderName}>
        {folder.folderName}
      </Text>
      <Text style={styles.folderSub}>
        {folder.videos.length} {folder.videos.length === 1 ? 'video' : 'videos'}
      </Text>
    </Pressable>
  );
}
