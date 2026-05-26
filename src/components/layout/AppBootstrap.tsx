import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StatusBar, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootNavigator } from '../../navigation/RootNavigator';
import { PlayerBootstrap } from '../player/PlayerBootstrap';
import { ThemedAlertProvider } from '../common/ThemedAlertProvider';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { PermissionScreen } from '../../screens/PermissionScreen';
import { requestStoragePermission } from '../../services/StorageScanner';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { Typography } from '../../theme/typography';
import { showThemedAlert } from '../../utils/themedAlert';
import { Logger } from '../../utils/logger';
import { migrateAsyncStorageToMMKV } from '../../utils/storageMigration';
import { SkeletonLoader } from '../library/SkeletonLoader';
import { styles } from '../../styles/components/layout/AppBootstrapStyles';
import { VideoPlayerOverlay } from '../../screens/video/VideoPlayerScreen';

export function AppBootstrap(): React.ReactElement {
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [playerHydrated, setPlayerHydrated] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const scanProgress = useLibraryStore(s => s.scanProgress);
  const isLoaded = useLibraryStore(s => s.isLoaded);
  const songs = useLibraryStore(s => s.songs);
  const scanLibrary = useLibraryStore(s => s.scanLibrary);

  useEffect(() => {
    // Migrate AsyncStorage → MMKV on first launch after update
    migrateAsyncStorageToMMKV().catch(() => {});

    const unsubLib = useLibraryStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    const unsubPlayer = usePlayerStore.persist.onFinishHydration(() =>
      setPlayerHydrated(true),
    );

    if (useLibraryStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    if (usePlayerStore.persist.hasHydrated()) {
      setPlayerHydrated(true);
    }

    return () => {
      unsubLib();
      unsubPlayer();
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !playerHydrated) {
      return;
    }
    let alive = true;
    (async () => {
      try {
        const ok = await requestStoragePermission();
        if (!alive) {
          return;
        }
        setAllowed(ok);
        setChecked(true);

        // Only scan if library is empty (first time)
        // User can pull-to-refresh to rescan manually
        if (ok) {
          if (!isLoaded || songs.length === 0) {
            Logger.info('AppBootstrap', 'Starting initial library scan');
            await scanLibrary();
            Logger.info('AppBootstrap', 'Library scan completed');
          }
        } else if (!ok) {
          Logger.warn('AppBootstrap', 'Storage permission denied');
          useLibraryStore.setState({ isLoaded: true, isScanning: false });
        }
      } catch (err) {
        Logger.error('AppBootstrap', 'Error during initialization', err);
        if (alive) {
          setChecked(true);
          useLibraryStore.setState({ isLoaded: true, isScanning: false });
          showThemedAlert({
            title: 'Initialization Error',
            message: 'Failed to initialize the app. Please try restarting.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, playerHydrated, isLoaded, songs.length, scanLibrary]);

  const onGrant = useCallback(async () => {
    const ok = await requestStoragePermission();
    setAllowed(ok);
    if (ok) {
      useLibraryStore.setState({ isLoaded: false });
      await scanLibrary();
    } else {
      showThemedAlert({
        title: 'Permission needed',
        message:
          'AV Player needs access to your audio and video files on this device to build your offline library.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  }, [scanLibrary]);

  let body: React.ReactElement;
  if (!checked) {
    body = (
      <View style={styles.boot}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
      </View>
    );
  } else if (!allowed) {
    body = (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <PermissionScreen onGrant={onGrant} />
      </>
    );
  } else if (!isLoaded) {
    body = (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <View
          style={[styles.scan, styles.scanInner]}
        >
          <ErrorBoundary>
            <Animated.View
              style={[styles.lottie, { transform: [{ rotate }] }]}
            >
              <Icon name="sync" size={96} color="#1DB954" />
            </Animated.View>
            <Text style={[Typography.title, styles.scanTitle]}>
              Indexing your library
            </Text>
            <Text style={[Typography.body, styles.scanCount]}>
              {scanProgress} files discovered
            </Text>
            <View style={styles.skeletonContainer}>
              <SkeletonLoader height={24} />
              <SkeletonLoader height={14} />
              <SkeletonLoader height={14} />
            </View>
          </ErrorBoundary>
        </View>
      </>
    );
  } else {
    body = (
      <ErrorBoundary>
        <>
          <RootNavigator />
          <PlayerBootstrap />
          <VideoPlayerOverlay />
        </>
      </ErrorBoundary>
    );
  }

  return (
    <ThemedAlertProvider>
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        {body}
      </>
    </ThemedAlertProvider>
  );
}

