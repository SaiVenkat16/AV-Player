import React from 'react';
import { Image, Pressable, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { toImageSource } from '../../utils/mediaUri';
import { Typography } from '../../theme/typography';
import type { Album } from '../../types';
import { styles } from '../../styles/components/library/AlbumCardStyles';

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

