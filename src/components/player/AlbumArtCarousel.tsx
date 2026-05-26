import React, { useEffect } from 'react';
import { Dimensions, Image, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { toImageSource } from '../../utils/mediaUri';
import type { Song } from '../../types';
import { styles } from '../../styles/components/player/AlbumArtCarouselStyles';


const W = Dimensions.get('window').width;

type Props = {
  song: Song;
  isPlaying: boolean;
  shuffle: boolean;
};

export function AlbumArtCarousel({ song, isPlaying, shuffle }: Props): React.ReactElement {
  const rot = useSharedValue(0);
  useEffect(() => {
    if (isPlaying) {
      rot.value = withRepeat(withTiming(360, { duration: 30000 }), -1, false);
    } else {
      rot.value = withTiming(0, { duration: 220 });
    }
  }, [isPlaying, rot]);
  const artStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));
  const data = [song];
  return (
    <View style={styles.wrap}>
      {shuffle ? (
        <View style={styles.vinyl}>
          <LinearGradient colors={['#111827', '#020617']} style={styles.vinylInner} />
        </View>
      ) : null}
      <Carousel
        width={W}
        height={320}
        data={data}
        enabled={false}
        renderItem={() => (
          <View style={styles.center}>
            <Animated.View style={[styles.artCard, artStyle]}>
              {song.albumArt ? (
                <Image source={toImageSource(song.albumArt)} style={styles.img} resizeMode="cover" />
              ) : (
                <LinearGradient colors={[...Colors.gradient1]} style={styles.img} />
              )}
            </Animated.View>
          </View>
        )}
      />
    </View>
  );
}

