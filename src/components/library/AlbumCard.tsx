import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { toImageSource } from '../../utils/mediaUri';
import { Typography } from '../../theme/typography';
import type { Album } from '../../types';

type Props = { album: Album; onPress: () => void };

export function AlbumCard({ album, onPress }: Props): React.ReactElement {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {album.artUri ? (
        <Image source={toImageSource(album.artUri)} style={styles.art} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[...Colors.gradient2]} style={styles.art} />
      )}
      <Text numberOfLines={2} style={[Typography.subtitle, styles.t]}>
        {album.name}
      </Text>
      <Text style={[Typography.caption, styles.c]}>{album.songIds.length} tracks</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 8 },
  art: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  t: { color: Colors.textPrimary, fontWeight: '700' },
  c: { color: Colors.textMuted, marginTop: 2 },
});
