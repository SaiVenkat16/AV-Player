import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { toImageSource } from '../../utils/mediaUri';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { Song } from '../../types';

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

const styles = StyleSheet.create({
  sec: { color: Colors.textMuted, marginLeft: 16, marginVertical: 8 },
  recent: { maxHeight: 220, paddingLeft: 12 },
  rcard: {
    width: 160,
    height: 200,
    marginHorizontal: 8,
    borderRadius: 18,
    padding: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  rcardActive: { borderColor: Colors.accent1, shadowColor: Colors.accent1, shadowOpacity: 0.5, shadowRadius: 12 },
  rimg: { flex: 1, borderRadius: 14, marginBottom: 8, backgroundColor: '#111' },
  fallbackArt: { backgroundColor: Colors.surfaceElevated },
  songTitle: { color: Colors.textPrimary },
});
