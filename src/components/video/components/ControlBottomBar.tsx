import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { styles } from '../../../styles/components/video/EmbeddedVideoPlayerStyles';
import { Colors } from '../../../theme/colors';
import { formatTime } from '../../../utils/formatTime';

interface ControlBottomBarProps {
  pos: number;
  dur: number;
  prog: number;
  videoBookmarks: { time: number; label: string }[];
  onSeekTo: (sec: number) => void;
  onAddBookmark: () => void;
  rate: number;
  onCycleRate: () => void;
  isOrientationLocked: boolean;
  onToggleOrientationLock: () => void;
  pipActive: boolean;
  onTogglePip: () => void;
}

export function ControlBottomBar({
  pos,
  dur,
  prog,
  videoBookmarks,
  onSeekTo,
  onAddBookmark,
  rate,
  onCycleRate,
  isOrientationLocked,
  onToggleOrientationLock,
  pipActive,
  onTogglePip,
}: ControlBottomBarProps): React.ReactElement {
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  const handleProgressBarPress = (e: any) => {
    const ratio = e.nativeEvent.locationX / (progressBarWidth || 1);
    onSeekTo(ratio * dur);
  };

  return (
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.85)']}
      style={styles.bottomBar}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.progressTouch}
        onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
        onPress={handleProgressBarPress}
      >
        <View style={styles.track} pointerEvents="none">
          <View style={[styles.played, { width: `${prog * 100}%` }]}>
            <LinearGradient
              colors={[Colors.accent1, Colors.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={[styles.thumb, { left: `${prog * 100}%` as any }]} />

          {/* Bookmark Timeline Ticks */}
          {videoBookmarks.map((b, idx) => {
            const tickLeft = dur > 0 ? (b.time / dur) * 100 : 0;
            return (
              <View
                key={idx}
                style={[styles.bookmarkTick, { left: `${tickLeft}%` }]}
              />
            );
          })}
        </View>
      </TouchableOpacity>

      <View style={styles.bottomControlsRow}>
        <Text style={styles.timeText}>
          {formatTime(pos)} / {formatTime(dur)}
        </Text>

        <View style={styles.bottomRightControls}>
          <Pressable onPress={onAddBookmark} hitSlop={12}>
            <MaterialCommunityIcons name="bookmark-plus-outline" size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={onCycleRate} hitSlop={12}>
            <Text style={styles.rateText}>{rate}x</Text>
          </Pressable>
          <Pressable onPress={onToggleOrientationLock} hitSlop={12}>
            <MaterialCommunityIcons
              name={isOrientationLocked ? 'screen-rotation-lock' : 'screen-rotation'}
              size={22}
              color={isOrientationLocked ? Colors.accent3 : '#fff'}
            />
          </Pressable>
          <Pressable onPress={onTogglePip} hitSlop={12}>
            <MaterialCommunityIcons
              name={
                pipActive
                  ? 'picture-in-picture-bottom-right'
                  : 'picture-in-picture-bottom-right-outline'
              }
              size={22}
              color={pipActive ? Colors.accent1 : '#fff'}
            />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}
