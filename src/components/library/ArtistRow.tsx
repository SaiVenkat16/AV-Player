import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { toImageSource } from '../../utils/mediaUri';
import type { Song, Artist } from '../../types';
import { styles } from '../../styles/components/library/ArtistRowStyles';

interface ArtistRowProps {
  artist: Artist;
  songs: Song[];
  onPress: () => void;
}

export function ArtistRow({ artist, songs, onPress }: ArtistRowProps): React.ReactElement {
  const artSong = songs.find((s) => s.id === artist.songIds[0] && s.albumArt);
  return (
    <Pressable
      style={styles.artistRow}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
    >
      {artSong?.albumArt ? (
        <Image
          source={toImageSource(artSong.albumArt)}
          style={styles.artistAvatar}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient colors={['#1e1e3a', '#12122a']} style={styles.artistAvatar}>
          <MaterialCommunityIcons name="account-music" size={26} color={Colors.accent1} />
        </LinearGradient>
      )}
      <View style={styles.artistMeta}>
        <Text style={styles.artistName}>{artist.name}</Text>
        <Text style={styles.artistSub}>
          {artist.songIds.length} {artist.songIds.length === 1 ? 'track' : 'tracks'}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
    </Pressable>
  );
}
