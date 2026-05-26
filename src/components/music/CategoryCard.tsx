import React from 'react';
import { Pressable, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import type { Song } from '../../types';
import { styles } from '../../styles/components/music/CategoryCardStyles';

export type CategoryGroup = {
  key: string;
  label: string;
  icon: string;
  color: string[];
  songs: Song[];
};

interface CategoryCardProps {
  cat: CategoryGroup;
  onPress: () => void;
  cardWidth: number;
}

export function CategoryCard({ cat, onPress, cardWidth }: CategoryCardProps): React.ReactElement {
  return (
    <Pressable
      style={[styles.catCard, { width: cardWidth }]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.07)' }}
    >
      <LinearGradient colors={cat.color as any} style={styles.catGradient}>
        <MaterialCommunityIcons name={cat.icon} size={32} color="#fff" />
        <Text style={styles.catLabel}>{cat.label}</Text>
        <Text style={styles.catCount}>{cat.songs.length} tracks</Text>
      </LinearGradient>
    </Pressable>
  );
}
