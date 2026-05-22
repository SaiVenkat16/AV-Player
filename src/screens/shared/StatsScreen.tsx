import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import { useSettingsStore } from '../../store/settingsStore';
import { useLibraryStore } from '../../store/libraryStore';
import { formatTime } from '../../utils/formatTime';

type Nav = NativeStackNavigationProp<MusicStackParamList>;
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function StatsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const stats = useSettingsStore((s) => s.stats);
  const songs = useLibraryStore((s) => s.songs);
  const top = stats.topSongIdsWeek
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  return (
    <View style={styles.root}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={[Typography.subtitle, styles.backText]}>‹ Back</Text>
      </Pressable>
      <Text style={[Typography.hero, styles.t]}>Listening stats</Text>
      <Text style={[Typography.body, styles.row]}>
        Total listened: {formatTime(stats.totalSeconds)}
      </Text>
      <Text style={[Typography.body, styles.row]}>Top artist: {stats.topArtistName || '—'}</Text>
      <Text style={[Typography.body, styles.row]}>Streak: {stats.streakDays} days</Text>
      <Text style={[Typography.subtitle, styles.sectionTitle]}>Top songs</Text>
      {top.length > 0 ? (
        top.map((s) => (
          <Text key={s.id} style={[Typography.body, styles.row]}>
            {s.title} — {s.artist}
          </Text>
        ))
      ) : (
        <Text style={[Typography.body, styles.row]}>No listening data yet</Text>
      )}
      <Text style={[Typography.subtitle, styles.sectionTitle]}>By weekday</Text>
      {stats.weekdaySeconds.map((sec, i) => (
        <Text key={i} style={[Typography.caption, styles.row]}>
          {WEEKDAY_LABELS[i] ?? `Day ${i}`}: {formatTime(sec)}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  t: { color: Colors.textPrimary, marginLeft: 16 },
  row: { color: Colors.textSecondary, marginHorizontal: 16, marginBottom: 6 },
  back: { padding: 16 },
  backText: { color: Colors.accent2 },
  sectionTitle: { color: Colors.textPrimary, margin: 16 },
});
