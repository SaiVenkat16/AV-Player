import React from 'react';
import { ActivityIndicator, Platform, Pressable, StatusBar, Text, View } from 'react-native';
import Video, { SelectedTrackType, ViewType } from 'react-native-video';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import type { Video as VideoItem } from '../../types';
import { styles } from '../../styles/components/video/EmbeddedVideoPlayerStyles';

// Sub-components & Custom hooks
import { VideoGestureHandler } from './VideoGestureHandler';
import { GestureHUD } from './GestureHUD';
import { DoubleTapSeekOverlay } from './DoubleTapSeekOverlay';
import { VideoErrorOverlay } from './VideoErrorOverlay';
import { DictionaryCard } from './components/DictionaryCard';
import { ControlTopBar } from './components/ControlTopBar';
import { ControlCenterPlay } from './components/ControlCenterPlay';
import { ControlBottomBar } from './components/ControlBottomBar';
import { TracksModal, type SubtitleTrackInfo } from './components/TracksModal';
import { ThemedToast } from '../common/ThemedToast';
import { setImmersiveMode } from '../../services/FileOpsService';
import { useVideoPlayerState } from './hooks/useVideoPlayerState';

const RESIZE_MODES = ['contain', 'cover', 'stretch'] as const;

export function EmbeddedVideoPlayer({
  item,
  onBack,
}: {
  item: VideoItem;
  onBack: () => void;
}): React.ReactElement {
  const {
    paused,
    setPaused,
    pos,
    dur,
    showControls,
    resizeIdx,
    setResizeIdx,
    error,
    loading,
    rate,
    pipActive,
    setPipActive,
    hud,
    doubleTapState,
    subOpen,
    setSubOpen,
    selectedSubIdx,
    setSelectedSubIdx,
    dictWord,
    setDictWord,
    dictMeaning,
    isOrientationLocked,
    setIsOrientationLocked,
    audioTracks,
    selectedAudioTrackIdx,
    setSelectedAudioTrackIdx,
    audioOpen,
    setAudioOpen,
    controlsLocked,
    setControlsLocked,
    embeddedTextTracks,
    selectedEmbeddedSubIdx,
    setSelectedEmbeddedSubIdx,
    resumeToast,
    setResumeToast,
    externalTracks,
    videoRef,
    uri,
    prog,
    activeCue,
    toggleControls,
    goBack,
    seek,
    seekTo,
    handleProgress,
    handleGestureHud,
    handleDoubleTap,
    handleWordPress,
    cyclePlaybackRate,
    togglePip,
    handleLoad,
    handleError,
    handleEnd,
  } = useVideoPlayerState({ item, onBack });

  // Build a unified subtitle list from embedded text tracks + external SRTs.
  // IDs are tagged so we can route the selection back to the correct source.
  const subtitleTracks = React.useMemo<SubtitleTrackInfo[]>(() => {
    const list: SubtitleTrackInfo[] = [];
    embeddedTextTracks.forEach((t, i) => {
      list.push({
        id: 1000 + i, // embedded id space
        source: 'embedded',
        title: t.title || t.language || `Track ${i + 1}`,
        language: t.language,
        type: t.type,
        index: t.index,
      });
    });
    externalTracks.forEach((t, i) => {
      list.push({
        id: 2000 + i, // external id space
        source: 'external',
        title: t.title || `Subtitle ${i + 1}`,
        language: t.language,
        type: t.type,
        index: i,
        uri: t.uri,
      });
    });
    return list;
  }, [embeddedTextTracks, externalTracks]);

  // Currently selected unified subtitle id. -1 = off.
  const selectedSubtitleId = React.useMemo(() => {
    if (selectedEmbeddedSubIdx !== -1) {
      return 1000 + selectedEmbeddedSubIdx;
    }
    if (selectedSubIdx !== -1) {
      return 2000 + selectedSubIdx;
    }
    return -1;
  }, [selectedEmbeddedSubIdx, selectedSubIdx]);

  const handleSelectSubtitle = React.useCallback(
    (id: number) => {
      if (id === -1) {
        setSelectedSubIdx(-1);
        setSelectedEmbeddedSubIdx(-1);
        return;
      }
      if (id >= 2000) {
        setSelectedEmbeddedSubIdx(-1);
        setSelectedSubIdx(id - 2000);
        return;
      }
      // Embedded: id range 1000+
      setSelectedSubIdx(-1);
      setSelectedEmbeddedSubIdx(id - 1000);
    },
    [setSelectedSubIdx, setSelectedEmbeddedSubIdx],
  );

  // Enter Android immersive mode so video covers the system bars.
  React.useEffect(() => {
    setImmersiveMode(true);
    return () => {
      setImmersiveMode(false);
    };
  }, []);

  return (
    <View style={styles.root} collapsable={false}>
      <StatusBar hidden animated={false} />

      {/* Video rendered directly as child of root - not inside GestureHandler */}
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={RESIZE_MODES[resizeIdx]}
        paused={paused}
        rate={rate}
        viewType={Platform.OS === 'android' ? ViewType.TEXTURE : undefined}
        enterPictureInPictureOnLeave={pipActive}
        onPictureInPictureStatusChanged={(e) => setPipActive(e.isActive)}
        selectedAudioTrack={
          selectedAudioTrackIdx !== -1
            ? { type: SelectedTrackType.INDEX, value: selectedAudioTrackIdx }
            : undefined
        }
        selectedTextTrack={
          selectedEmbeddedSubIdx !== -1
            ? { type: SelectedTrackType.INDEX, value: selectedEmbeddedSubIdx }
            : { type: SelectedTrackType.DISABLED, value: undefined as never }
        }
        controls={false}
        hideShutterView
        shutterColor="transparent"
        progressUpdateInterval={500}
        playInBackground={false}
        preventsDisplaySleepDuringVideoPlayback
        onLoad={handleLoad}
        onProgress={handleProgress}
        onError={handleError}
        onEnd={handleEnd}
      />

      {/* Gesture layer on top of video */}
      <VideoGestureHandler
        locked={controlsLocked}
        controlsActive={showControls && !controlsLocked}
        onHud={handleGestureHud}
        onDoubleTap={handleDoubleTap}
        onSingleTap={toggleControls}
      >
        {/* Subtle loading spinner shown while the native video surface
            initialises (otherwise users see a brief plain black screen). */}
        {loading && !error && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        <GestureHUD visible={hud.visible} icon={hud.icon} label={hud.label} barFraction={hud.bar} side={hud.side} />

        <DoubleTapSeekOverlay side={doubleTapState.side} times={doubleTapState.count} />

        <VideoErrorOverlay error={error} />

        {/* Dynamic click-to-translate subtitle overlay */}
        {activeCue && selectedSubIdx !== -1 && (
          <View style={styles.subtitleOverlay}>
            <View style={styles.subtitleRow}>
              {activeCue.text.replace(/<[^>]*>/g, '').split(/\s+/).map((word, idx) => (
                <Text
                  key={idx}
                  style={styles.subtitleWord}
                  onPress={() => handleWordPress(word)}
                >
                  {word}{' '}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Dictionary Translation Modal */}
        {dictWord && (
          <DictionaryCard
            word={dictWord}
            meaning={dictMeaning}
            onClose={() => setDictWord(null)}
            onResume={() => {
              setDictWord(null);
              setPaused(false);
            }}
          />
        )}

        {showControls && !error && !controlsLocked && (
          <View style={styles.overlay} pointerEvents="box-none">
            <ControlTopBar
              title={item.title}
              resizeIdx={resizeIdx}
              onBack={goBack}
              onOpenTracks={() => setAudioOpen(true)}
              onCycleResize={() => setResizeIdx((i) => (i + 1) % RESIZE_MODES.length)}
            />

            <ControlCenterPlay
              paused={paused}
              onTogglePlay={() => {
                setPaused((p) => !p);
              }}
              onSeek={seek}
            />

            <ControlBottomBar
              pos={pos}
              dur={dur}
              prog={prog}
              onSeekTo={seekTo}
              rate={rate}
              onCycleRate={cyclePlaybackRate}
              isOrientationLocked={isOrientationLocked}
              onToggleOrientationLock={() => setIsOrientationLocked(!isOrientationLocked)}
              pipActive={pipActive}
              onTogglePip={togglePip}
              controlsLocked={controlsLocked}
              onToggleControlsLock={() => setControlsLocked((v) => !v)}
            />
          </View>
        )}
        {/* Locked-state unlock button (always visible while locked) */}
        {controlsLocked && (
          <Pressable
            onPress={() => setControlsLocked(false)}
            style={styles.lockedFloatingBtn}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="lock" size={22} color="#fff" />
          </Pressable>
        )}
      </VideoGestureHandler>

      {/* Subtitles + Audio Tracks combined modal */}
      <TracksModal
        visible={audioOpen || subOpen}
        onClose={() => {
          setAudioOpen(false);
          setSubOpen(false);
        }}
        audioTracks={audioTracks}
        selectedAudioTrackIdx={selectedAudioTrackIdx}
        onSelectAudio={setSelectedAudioTrackIdx}
        subtitleTracks={subtitleTracks}
        selectedSubtitleId={selectedSubtitleId}
        onSelectSubtitle={handleSelectSubtitle}
      />

      {/* Themed app-level toast (e.g. resume position notice) */}
      <ThemedToast message={resumeToast} onHide={() => setResumeToast(null)} />
    </View>
  );
}
