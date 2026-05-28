import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import type { Video } from '../../types';
import { getVideoFolderIcon } from '../../utils/folderIcon';
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
}

export function FolderCard({
  folder,
  onPress,
}: FolderCardProps): React.ReactElement {
  const { innerIcon, innerColor } = getVideoFolderIcon(folder.folderName);
  return (
    <Pressable
      style={styles.folderCard}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
    >
      <View style={styles.folderIcon}>
        <MaterialCommunityIcons name="folder" size={100} color={Colors.textMuted} />
        <View style={styles.folderInnerIcon}>
          <MaterialCommunityIcons name={innerIcon} size={34} color={innerColor} />
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
