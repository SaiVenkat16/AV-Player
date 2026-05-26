import React, { useEffect } from 'react';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { toImageSource } from '../../utils/mediaUri';
import { dominantAuraColorFromSeed, softenHex } from '../../utils/colorExtractor';
import type { Song } from '../../types';
import { styles } from '../../styles/components/player/NowPlayingCoverStyles';

interface NowPlayingCoverProps {
  song: Song;
  fav: boolean;
  playing: boolean;
  onToggleFav: () => void;
  onTogglePlay: () => void;
}

export function NowPlayingCover({
  song,
  fav,
  playing,
  onToggleFav,
  onTogglePlay,
}: NowPlayingCoverProps): React.ReactElement {
  const cdRotation = useSharedValue(0);
  const aura = dominantAuraColorFromSeed(song.id ?? 'x');

  // Rotate CD when playing, stop when paused
  useEffect(() => {
    if (playing) {
      cdRotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(cdRotation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const cdStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${cdRotation.value}deg` }],
  }));

  // Reusable overlay buttons (Heart and Play)
  const renderOverlayButtons = () => (
    <>
      {/* Heart Button Top Right */}
      <Pressable style={styles.heartButtonCorner} onPress={onToggleFav} hitSlop={16}>
        <MaterialCommunityIcons
          name={fav ? 'heart' : 'heart-outline'}
          size={32}
          color={fav ? Colors.danger : '#fff'}
        />
      </Pressable>
      {/* Play Button Bottom Right */}
      <Pressable style={styles.playButtonCorner} onPress={onTogglePlay} hitSlop={16}>
        <MaterialCommunityIcons
          name={playing ? 'pause' : 'play'}
          size={40}
          color="#fff"
        />
      </Pressable>
    </>
  );

  return (
    <>
      {song.albumArt ? (
        <ImageBackground
          source={toImageSource(song.albumArt)}
          style={styles.fullArt}
          imageStyle={styles.fullArtImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
          />
          {renderOverlayButtons()}
        </ImageBackground>
      ) : (
        // No album art: rotating CD vinyl + controls
        <View style={styles.fullArt}>
          <LinearGradient
            colors={[softenHex(aura, 0.5), '#050510']}
            style={StyleSheet.absoluteFill}
          />
          {/* Vinyl disc */}
          <Animated.View style={[styles.vinyl, cdStyle]}>
            <LinearGradient
              colors={['#1a1a3a', '#080818']}
              style={styles.vinylDisc}
            >
              {/* Grooves */}
              <View style={styles.groove1} />
              <View style={styles.groove2} />
              {/* Center hole */}
              <LinearGradient
                colors={[softenHex(aura, 0.9), softenHex(aura, 0.6)]}
                style={styles.vinylCenter}
              />
            </LinearGradient>
          </Animated.View>
          {renderOverlayButtons()}
        </View>
      )}
    </>
  );
}
