import React from 'react';
import { Platform, StatusBar, Text, View } from 'react-native';
import Video, { SelectedTrackType, ViewType } from 'react-native-video';

import type { Video as VideoItem } from '../../types';
import { styles } from '../../styles/components/video/EmbeddedVideoPlayerStyles';

// Sub-components & Custom hooks
import { VideoGestureHandler } from './VideoGestureHandler';
import { GestureHUD } from './GestureHUD';
import { DoubleTapSeekOverlay } from './DoubleTapSeekOverlay';
import { VideoErrorOverlay } from './VideoErrorOverlay';
import { VideoPoster } from './VideoPoster';
import { SubtitleSheet } from './SubtitleSheet';
import { DictionaryCard } from './components/DictionaryCard';
import { VolumeBrightnessSliders } from './components/VolumeBrightnessSliders';
import { ControlTopBar } from './components/ControlTopBar';
import { ControlCenterPlay } from './components/ControlCenterPlay';
import { ControlBottomBar } from './components/ControlBottomBar';
import { AudioTrackSheet } from './components/AudioTrackSheet';
import { SceneBookmarksSheet } from './components/SceneBookmarksSheet';
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
    sceneOpen,
    setSceneOpen,
    volume,
    brightness,
    isOrientationLocked,
    setIsOrientationLocked,
    audioTracks,
    selectedAudioTrackIdx,
    setSelectedAudioTrackIdx,
    audioOpen,
    setAudioOpen,
    externalTracks,
    videoRef,
    uri,
    prog,
    activeCue,
    videoBookmarks,
    removeBookmark,
    toggleControls,
    goBack,
    seek,
    seekTo,
    handleProgress,
    handleGestureHud,
    handleDoubleTap,
    handleWordPress,
    handleAddBookmark,
    cyclePlaybackRate,
    togglePip,
    handleLoad,
    handleError,
    handleEnd,
  } = useVideoPlayerState({ item, onBack });

  return (
    <View style={styles.root} collapsable={false}>
      <StatusBar hidden />

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
        locked={false}
        onHud={handleGestureHud}
        onDoubleTap={handleDoubleTap}
        onSingleTap={toggleControls}
      >
        {/* Video poster and Gestures HUDs */}
        <VideoPoster source={item.thumbnailUri ? { uri: item.thumbnailUri } : null} visible={loading} />

        <GestureHUD visible={hud.visible} icon={hud.icon} label={hud.label} barFraction={hud.bar} />

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

        {showControls && !error && (
          <View style={styles.overlay} pointerEvents="box-none">
            <ControlTopBar
              title={item.title}
              resizeIdx={resizeIdx}
              onBack={goBack}
              onOpenScenes={() => setSceneOpen(true)}
              onOpenAudio={() => setAudioOpen(true)}
              onOpenSubtitles={() => setSubOpen(true)}
              onCycleResize={() => setResizeIdx((i) => (i + 1) % RESIZE_MODES.length)}
            />

            <VolumeBrightnessSliders volume={volume} brightness={brightness} />

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
              videoBookmarks={videoBookmarks}
              onSeekTo={seekTo}
              onAddBookmark={handleAddBookmark}
              rate={rate}
              onCycleRate={cyclePlaybackRate}
              isOrientationLocked={isOrientationLocked}
              onToggleOrientationLock={() => setIsOrientationLocked(!isOrientationLocked)}
              pipActive={pipActive}
              onTogglePip={togglePip}
            />
          </View>
        )}
      </VideoGestureHandler>

      {/* Subtitles Track Selection Sheet */}
      <SubtitleSheet
        visible={subOpen}
        onClose={() => setSubOpen(false)}
        tracks={externalTracks}
        selectedIndex={selectedSubIdx}
        onSelect={setSelectedSubIdx}
      />

      {/* Audio Language Selection Sheet */}
      <AudioTrackSheet
        visible={audioOpen}
        onClose={() => setAudioOpen(false)}
        audioTracks={audioTracks}
        selectedAudioTrackIdx={selectedAudioTrackIdx}
        onSelectTrack={setSelectedAudioTrackIdx}
      />

      {/* Bookmark Scenes Drawer Sheet */}
      <SceneBookmarksSheet
        visible={sceneOpen}
        onClose={() => setSceneOpen(false)}
        videoBookmarks={videoBookmarks}
        onSeekTo={seekTo}
        onRemoveBookmark={(time) => removeBookmark(item.id, time)}
      />
    </View>
  );
}
