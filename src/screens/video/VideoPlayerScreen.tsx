import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video, {
  type OnLoadData,
  type OnProgressData,
} from 'react-native-video';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Orientation from 'react-native-orientation-locker';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import type { VideoStackParamList } from '../../navigation/VideoStack';
import { useLibraryStore } from '../../store/libraryStore';
import { toMediaUri } from '../../utils/mediaUri';
import { formatTime } from '../../utils/formatTime';

type Nav = NativeStackNavigationProp<VideoStackParamList>;
type R = RouteProp<VideoStackParamList, 'VideoPlayer'>;

const { width: W } = Dimensions.get('window');
const RESIZE_MODES = ['contain', 'cover', 'stretch'] as const;

export function VideoPlayerScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();

  const videos = useLibraryStore((s) => s.videos);
  const setMeta = useLibraryStore((s) => s.setVideoMeta);
  const item = videos.find((v) => v.id === route.params.videoId);

  const [paused, setPaused] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [resizeIdx, setResizeIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<any>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posRef = useRef(0);
  const durRef = useRef(0);

  // Sync refs for gesture handlers
  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { durRef.current = dur; }, [dur]);

  // Allow free rotation
  useFocusEffect(
    useCallback(() => {
      Orientation.unlockAllOrientations();
      return () => {
        Orientation.lockToPortrait();
      };
    }, []),
  );

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    scheduleHide();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [scheduleHide]);

  const toggleControls = useCallback(() => {
    setShowControls((v) => {
      if (!v) scheduleHide();
      else if (hideTimer.current) clearTimeout(hideTimer.current);
      return !v;
    });
  }, [scheduleHide]);

  const goBack = useCallback(() => {
    Orientation.lockToPortrait();
    navigation.goBack();
  }, [navigation]);

  const seek = useCallback((delta: number) => {
    const next = Math.max(0, Math.min(durRef.current, posRef.current + delta));
    posRef.current = next;
    setPos(next);
    videoRef.current?.seek(next);
    scheduleHide();
  }, [scheduleHide]);

  const seekTo = useCallback((sec: number) => {
    const next = Math.max(0, Math.min(durRef.current, sec));
    posRef.current = next;
    setPos(next);
    videoRef.current?.seek(next);
    scheduleHide();
  }, [scheduleHide]);

  if (!item) {
    return (
      <View style={styles.root}>
        <Text style={styles.errText}>Video not found</Text>
        <Pressable onPress={goBack}>
          <Text style={styles.backLink}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const uri = toMediaUri(item.path) ?? item.path;
  const prog = dur > 0 ? Math.min(1, pos / dur) : 0;

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* ── Video — plain View, no Animated wrapper, no gesture wrapper ── */}
      <Video
        ref={videoRef}
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode={RESIZE_MODES[resizeIdx]}
        paused={paused}
        controls={false}
        progressUpdateInterval={500}
        playInBackground={false}
        preventsDisplaySleepDuringVideoPlayback
        onLoad={(d: OnLoadData) => {
          setDur(d.duration);
          durRef.current = d.duration;
          setError(null);
          if (d.naturalSize) {
            setMeta(item.id, {
              duration: d.duration,
              width: d.naturalSize.width,
              height: d.naturalSize.height,
            });
          }
          Orientation.unlockAllOrientations();
        }}
        onProgress={(p: OnProgressData) => {
          setPos(p.currentTime);
          posRef.current = p.currentTime;
        }}
        onError={(e: any) => {
          setError(e?.error?.errorString ?? 'Playback failed');
          setPaused(true);
        }}
        onEnd={() => {
          setPaused(true);
          setPos(dur);
          setShowControls(true);
        }}
      />

      {/* ── Error overlay ── */}
      {error && (
        <View style={styles.errorOverlay}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ff4444" />
          <Text style={styles.errText}>{error}</Text>
          <Text style={styles.errPath} numberOfLines={3}>{item.path}</Text>
          <Pressable style={styles.retryBtn} onPress={() => {
            setError(null);
            setPaused(false);
          }}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* ── Tap area — toggle controls ── */}
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={toggleControls}
      />

      {/* ── Controls overlay ── */}
      {showControls && !error && (
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Top bar */}
          <LinearGradient
            colors={['rgba(0,0,0,0.75)', 'transparent']}
            style={styles.topBar}>
            <Pressable onPress={goBack} style={styles.backBtn} hitSlop={12}>
              <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
            </Pressable>
            <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
            <Pressable
              onPress={() => setResizeIdx((i) => (i + 1) % RESIZE_MODES.length)}
              hitSlop={12}>
              <MaterialCommunityIcons
                name={resizeIdx === 0 ? 'fit-to-screen' : resizeIdx === 1 ? 'crop' : 'arrow-expand-all'}
                size={22}
                color="#fff"
              />
            </Pressable>
          </LinearGradient>

          {/* Center play/pause */}
          <View style={styles.centerRow} pointerEvents="box-none">
            <Pressable
              onPress={() => { seek(-10); }}
              style={styles.seekBtn}
              hitSlop={16}>
              <MaterialCommunityIcons name="rewind-10" size={36} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => { setPaused((p) => !p); scheduleHide(); }}
              style={styles.playPauseBtn}
              hitSlop={8}>
              <MaterialCommunityIcons
                name={paused ? 'play-circle' : 'pause-circle'}
                size={72}
                color="#fff"
              />
            </Pressable>
            <Pressable
              onPress={() => { seek(10); }}
              style={styles.seekBtn}
              hitSlop={16}>
              <MaterialCommunityIcons name="fast-forward-10" size={36} color="#fff" />
            </Pressable>
          </View>

          {/* Bottom bar */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.bottomBar}>
            {/* Progress bar */}
            <TouchableOpacity
              activeOpacity={1}
              style={styles.progressTouch}
              onPress={(e) => {
                const ratio = e.nativeEvent.locationX / W;
                seekTo(ratio * dur);
              }}>
              <View style={styles.track}>
                <View style={[styles.played, { width: `${prog * 100}%` }]}>
                  <LinearGradient
                    colors={[Colors.accent1, Colors.accent2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
                <View style={[styles.thumb, { left: `${prog * 100}%` as any }]} />
              </View>
            </TouchableOpacity>
            <Text style={styles.timeText}>{formatTime(pos)} / {formatTime(dur)}</Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 12 : 44,
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  backBtn: { marginRight: 8 },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  seekBtn: { opacity: 0.9 },
  playPauseBtn: { opacity: 0.95 },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 20 : 32,
    paddingTop: 24,
  },
  progressTouch: {
    height: 28,
    justifyContent: 'center',
    marginBottom: 4,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'visible',
  },
  played: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    top: -5,
    marginLeft: -7,
  },
  timeText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  errPath: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.accent1,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  backLink: {
    color: Colors.accent2,
    fontSize: 16,
    marginTop: 12,
  },
});
