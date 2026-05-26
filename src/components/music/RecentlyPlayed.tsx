import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { toImageSource } from '../../utils/mediaUri';
import { Typography } from '../../theme/typography';
import type { Song } from '../../types';
import { styles } from '../../styles/components/music/RecentlyPlayedStyles';

interface RecentlyPlayedProps {
  recentSongs: Song[];
  currentSongId?: string;
  onSongPress: (song: Song) => void;
}

export function RecentlyPlayed({ recentSongs, currentSongId, onSongPress }: RecentlyPlayedProps): React.ReactElement {
  if (recentSongs.length === 0) return <></>;

  return (
    <View>
      <Text style={[Typography.caption, styles.sec]}>Recently played</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recent}>
        {recentSongs.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => onSongPress(s)}
            style={[styles.rcard, currentSongId === s.id && styles.rcardActive]}>
            {s.albumArt ? (
              <Image source={toImageSource(s.albumArt)} style={styles.rimg} resizeMode="cover" />
            ) : (
              <View style={[styles.rimg, styles.fallbackArt]} />
            )}
            <Text numberOfLines={1} style={[Typography.caption, styles.songTitle]}>
              {s.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

