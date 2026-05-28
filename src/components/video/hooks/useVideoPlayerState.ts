import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Orientation from 'react-native-orientation-locker';
import SystemSetting from 'react-native-system-setting';
import { OnLoadData, OnProgressData } from 'react-native-video';

import { useLibraryStore } from '../../../store/libraryStore';
import { usePlayerStore } from '../../../store/playerStore';
import { useVideoPlayerStore } from '../../../store/videoPlayerStore';
import { toMediaUri } from '../../../utils/mediaUri';
import { formatTime } from '../../../utils/formatTime';
import { parseSRT, type Cue } from '../../../utils/srtParser';
import { LOCAL_DICT } from '../../../constants/dictionary';
import { useExternalSubtitles } from '../../../hooks/useExternalSubtitles';
import type { Video as VideoItem } from '../../../types';

interface UseVideoPlayerStateProps {
  item: VideoItem;
  onBack: () => void;
}

export function useVideoPlayerState({ item, onBack }: UseVideoPlayerStateProps) {
  // Keep onBack in a ref to avoid re-creating goBack callback on every render
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  });

  const setMeta = useLibraryStore((s) => s.setVideoMeta);
  const videoBookmarks = useLibraryStore((s) => s.videoBookmarks[item.id]) ?? [];
  const addBookmark = useLibraryStore((s) => s.addVideoBookmark);
  const removeBookmark = useLibraryStore((s) => s.removeVideoBookmark);
  const savedProgress = useLibraryStore((s) => s.videoProgress[item.id]);
  const setVideoProgress = useLibraryStore((s) => s.setVideoProgress);
  const clearVideoProgress = useLibraryStore((s) => s.clearVideoProgress);

  const sleepTimerAt = usePlayerStore((s) => s.sleepTimerAt);
  const clearSleepTimer = usePlayerStore((s) => s.clearSleepTimer);

  const [paused, setPaused] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [resizeIdx, setResizeIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Playback Rate and PiP
  const [rate, setRate] = useState(1.0);
  const [pipActive, setPipActive] = useState(false);

  // HUD & Double Tap Overlays
  const [hud, setHud] = useState<{
    visible: boolean;
    icon: string;
    label: string;
    bar: number;
    side: 'left' | 'right' | 'center';
  }>({ visible: false, icon: '', label: '', bar: 0, side: 'center' });
  const [doubleTapState, setDoubleTapState] = useState<{
    side: 'left' | 'right' | null;
    count: number;
  }>({
    side: null,
    count: 0,
  });

  // Subtitles & Translate Dictionary states
  const [subOpen, setSubOpen] = useState(false);
  const [selectedSubIdx, setSelectedSubIdx] = useState(-1);
  const [subCues, setSubCues] = useState<Cue[]>([]);
  const subOffsetMs = 0;
  const [dictWord, setDictWord] = useState<string | null>(null);
  const [dictMeaning, setDictMeaning] = useState<string | null>(null);

  // Scenes list sheet
  const [sceneOpen, setSceneOpen] = useState(false);

  const [volume, setVolume] = useState(0.5);
  const [brightness, setBrightness] = useState(0.5);
  const [isOrientationLocked, setIsOrientationLocked] = useState(false);
  const [audioTracks, setAudioTracks] = useState<
    { index: number; title?: string; language?: string }[]
  >([]);
  const [selectedAudioTrackIdx, setSelectedAudioTrackIdx] = useState<number>(-1);
  const [audioOpen, setAudioOpen] = useState(false);
  const [controlsLocked, setControlsLocked] = useState(false);

  // Embedded text (subtitle) tracks reported by react-native-video on load
  const [embeddedTextTracks, setEmbeddedTextTracks] = useState<
    { index: number; title?: string; language?: string; type?: string }[]
  >([]);
  // -1 = no embedded track selected. Otherwise the embedded track index.
  const [selectedEmbeddedSubIdx, setSelectedEmbeddedSubIdx] = useState<number>(-1);

  // Resume toast (themed, app-styled — not the system Android toast)
  const [resumeToast, setResumeToast] = useState<string | null>(null);

  const externalTracks = useExternalSubtitles(item.path);

  const videoRef = useRef<any>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doubleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveAt = useRef(0);
  const resumeAppliedRef = useRef(false);

  const posRef = useRef(0);
  const durRef = useRef(0);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  useEffect(() => {
    durRef.current = dur;
  }, [dur]);

  // Load Subtitles
  useEffect(() => {
    if (selectedSubIdx === -1 || !externalTracks[selectedSubIdx]) {
      setSubCues([]);
      return;
    }
    const loadSubtitles = async () => {
      try {
        const track = externalTracks[selectedSubIdx];
        const filePath =
          Platform.OS === 'android' ? track.uri.replace('file://', '') : track.uri;
        const content = await RNFS.readFile(filePath, 'utf8');
        setSubCues(parseSRT(content));
      } catch {
        setSubCues([]);
      }
    };
    loadSubtitles();
  }, [selectedSubIdx, externalTracks]);

  // Volume & Brightness initial query + listener.
  // We also save the initial brightness so we can restore it on unmount —
  // without this the app-level brightness sticks to whatever the user set
  // during playback and bleeds into the rest of the UI.
  useEffect(() => {
    SystemSetting.getVolume('music').then(setVolume);

    let initialBrightness: number | null = null;
    SystemSetting.getAppBrightness().then((b) => {
      initialBrightness = b;
      setBrightness(b);
    });

    const volumeSub = SystemSetting.addVolumeListener((data) => {
      setVolume(data.value);
    });
    return () => {
      SystemSetting.removeVolumeListener(volumeSub);
      // Restore the original brightness when the player closes.
      if (initialBrightness !== null) {
        SystemSetting.setAppBrightness(initialBrightness);
      } else {
        // Fallback: hand control back to the system.
        SystemSetting.setAppBrightness(-1 as never);
      }
    };
  }, []);

  // Physical accelerometer-based device orientation override
  useEffect(() => {
    if (isOrientationLocked) {
      return;
    }
    const onDeviceOrientationChange = (deviceOrientation: string) => {
      if (deviceOrientation === 'LANDSCAPE-LEFT') {
        Orientation.lockToLandscapeLeft();
      } else if (deviceOrientation === 'LANDSCAPE-RIGHT') {
        Orientation.lockToLandscapeRight();
      } else if (deviceOrientation === 'PORTRAIT') {
        Orientation.lockToPortrait();
      }
    };
    Orientation.addDeviceOrientationListener(onDeviceOrientationChange);
    return () => {
      Orientation.removeDeviceOrientationListener(onDeviceOrientationChange);
    };
  }, [isOrientationLocked]);

  // Sleep Timer Countdown inside Video
  useEffect(() => {
    if (!sleepTimerAt) return;
    const interval = setInterval(() => {
      const timeLeft = sleepTimerAt - Date.now();
      if (timeLeft <= 0) {
        setPaused(true);
        clearSleepTimer();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerAt, clearSleepTimer]);

  // Auto-rotate to landscape when video player opens
  useEffect(() => {
    Orientation.lockToLandscape();
    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  useEffect(() => {
    return () => {
      Orientation.lockToPortrait();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (hudTimer.current) clearTimeout(hudTimer.current);
      if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
      // Save final position on unmount (user closed video mid-watch)
      if (
        durRef.current > 0 &&
        posRef.current > 5 &&
        posRef.current < durRef.current - 10
      ) {
        setVideoProgress(item.id, posRef.current, durRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3500);
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
    onBackRef.current();
  }, []);

  const seek = useCallback(
    (delta: number) => {
      const next = Math.max(0, Math.min(durRef.current, posRef.current + delta));
      posRef.current = next;
      setPos(next);
      videoRef.current?.seek(next);
      scheduleHide();
    },
    [scheduleHide],
  );

  const seekTo = useCallback(
    (sec: number) => {
      const next = Math.max(0, Math.min(durRef.current, sec));
      posRef.current = next;
      setPos(next);
      videoRef.current?.seek(next);
      scheduleHide();
    },
    [scheduleHide],
  );

  const handleProgress = useCallback((p: OnProgressData) => {
    setPos(p.currentTime);
    posRef.current = p.currentTime;
    // Throttled save (every 5 seconds) and only if duration is known
    const now = Date.now();
    if (durRef.current > 0 && now - lastSaveAt.current > 5000) {
      lastSaveAt.current = now;
      // Don't save very early progress (< 5s) or near the end (last 10s)
      if (p.currentTime > 5 && p.currentTime < durRef.current - 10) {
        setVideoProgress(item.id, p.currentTime, durRef.current);
      }
    }
  }, [item.id, setVideoProgress]);

  // Gesture Handlers
  const handleGestureHud = useCallback((payload: { icon: string; label: string; bar: number; side?: 'left' | 'right' | 'center' }) => {
    if (hudTimer.current) clearTimeout(hudTimer.current);
    setHud({
      visible: true,
      icon: payload.icon,
      label: payload.label,
      bar: payload.bar,
      side: payload.side ?? 'center',
    });
    if (payload.label === 'Brightness') {
      setBrightness(payload.bar);
    } else if (payload.label === 'Volume') {
      setVolume(payload.bar);
    }
    hudTimer.current = setTimeout(() => {
      setHud((h) => ({ ...h, visible: false }));
    }, 1500);
  }, []);

  const handleDoubleTap = useCallback(
    (side: 'left' | 'right') => {
      const isLeft = side === 'left';
      setDoubleTapState((prev) => {
        const nextCount = prev.side === side ? prev.count + 1 : 1;
        seek(isLeft ? -10 : 10);
        if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
        doubleTapTimer.current = setTimeout(() => {
          setDoubleTapState({ side: null, count: 0 });
        }, 900);
        return { side, count: nextCount };
      });
    },
    [seek],
  );

  // Clickable Subtitle Word Pressed
  const handleWordPress = useCallback((word: string) => {
    if (!word) return;
    setPaused(true);
    const clean = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '');
    const meaning = LOCAL_DICT[clean] ?? 'Dictionary definition not found offline.';
    setDictWord(word);
    setDictMeaning(meaning);
  }, []);

  // Bookmark added
  const handleAddBookmark = useCallback(() => {
    const label = `Scene at ${formatTime(pos)}`;
    addBookmark(item.id, pos, label);
    handleGestureHud({ icon: 'bookmark-plus', label: 'Bookmark Added', bar: 1.0 });
  }, [pos, item.id, addBookmark, handleGestureHud]);

  const cyclePlaybackRate = useCallback(() => {
    const rates = [1.0, 1.25, 1.5, 1.75, 2.0, 0.75];
    const nextIdx = (rates.indexOf(rate) + 1) % rates.length;
    setRate(rates[nextIdx]);
    handleGestureHud({
      icon: 'speedometer',
      label: `Speed: ${rates[nextIdx]}x`,
      bar: rates[nextIdx] / 2,
    });
  }, [rate, handleGestureHud]);

  const togglePip = useCallback(() => {
    if (pipActive) {
      videoRef.current?.exitPictureInPicture();
    } else {
      videoRef.current?.enterPictureInPicture();
    }
  }, [pipActive]);

  // Video Load / Error / End Callbacks
  const handleLoad = useCallback((d: OnLoadData) => {
    setDur(d.duration);
    durRef.current = d.duration;
    setError(null);
    setLoading(false);
    if (d.naturalSize?.width && d.naturalSize.height) {
      setMeta(item.id, {
        duration: d.duration,
        width: d.naturalSize.width,
        height: d.naturalSize.height,
      });
    }
    if (d.audioTracks) {
      setAudioTracks(d.audioTracks);
      const active = d.audioTracks.find((t) => t.selected);
      if (active) {
        setSelectedAudioTrackIdx(active.index);
      } else if (d.audioTracks.length > 0) {
        setSelectedAudioTrackIdx(d.audioTracks[0].index);
      }
    }
    // Capture embedded subtitle tracks (movies often ship multiple languages)
    if ((d as any).textTracks) {
      const tracks = (d as any).textTracks as Array<{
        index: number;
        title?: string;
        language?: string;
        type?: string;
      }>;
      setEmbeddedTextTracks(tracks ?? []);
    }
    // Auto-resume from saved position (only once per video open)
    if (!resumeAppliedRef.current && savedProgress && savedProgress.position > 5) {
      resumeAppliedRef.current = true;
      const target = Math.min(savedProgress.position, d.duration - 5);
      if (target > 0) {
        videoRef.current?.seek(target);
        posRef.current = target;
        setPos(target);
        setResumeToast(`Resumed at ${formatTime(target)}`);
      }
    }
  }, [item.id, setMeta, savedProgress]);

  const handleError = useCallback((e: any) => {
    setError(e?.error?.errorString ?? 'Playback failed');
    setPaused(true);
    setLoading(false);
  }, []);

  const handleEnd = useCallback(() => {
    setPaused(true);
    setPos(durRef.current);
    // Video completed - clear resume position
    clearVideoProgress(item.id);
    // Auto-advance to the next video in the playlist; if none, close the
    // player so the user lands back on the folder/list they came from.
    const advanced = useVideoPlayerStore.getState().playNext();
    if (!advanced) {
      onBackRef.current();
    }
    scheduleHide();
  }, [scheduleHide, clearVideoProgress, item.id]);

  const uri = toMediaUri(item.path) ?? item.path;
  const prog = dur > 0 ? Math.min(1, pos / dur) : 0;

  // Active Subtitle Cue
  const activeCue = subCues.find((cue) => {
    const adjustedTime = pos + subOffsetMs / 1000;
    return adjustedTime >= cue.startTime && adjustedTime <= cue.endTime;
  });

  return {
    paused,
    setPaused,
    pos,
    setPos,
    dur,
    setDur,
    showControls,
    setShowControls,
    resizeIdx,
    setResizeIdx,
    error,
    setError,
    loading,
    setLoading,
    rate,
    setRate,
    pipActive,
    setPipActive,
    hud,
    setHud,
    doubleTapState,
    setDoubleTapState,
    subOpen,
    setSubOpen,
    selectedSubIdx,
    setSelectedSubIdx,
    subCues,
    setSubCues,
    dictWord,
    setDictWord,
    dictMeaning,
    setDictMeaning,
    sceneOpen,
    setSceneOpen,
    volume,
    setVolume,
    brightness,
    setBrightness,
    isOrientationLocked,
    setIsOrientationLocked,
    audioTracks,
    setAudioTracks,
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
    posRef,
    durRef,
    uri,
    prog,
    activeCue,
    videoBookmarks,
    addBookmark,
    removeBookmark,
    sleepTimerAt,
    clearSleepTimer,
    scheduleHide,
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
  };
}
