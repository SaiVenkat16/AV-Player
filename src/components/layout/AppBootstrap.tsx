import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { RootNavigator } from '../../navigation/RootNavigator';
import { PlayerBootstrap } from '../player/PlayerBootstrap';
import { ThemedAlertProvider } from '../common/ThemedAlertProvider';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { PermissionScreen } from '../../screens/PermissionScreen';
import { requestStoragePermission } from '../../services/StorageScanner';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { showThemedAlert } from '../../utils/themedAlert';
import { Logger } from '../../utils/logger';

export function AppBootstrap(): React.ReactElement {
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [playerHydrated, setPlayerHydrated] = useState(false);
  const scanProgress = useLibraryStore(s => s.scanProgress);
  const isLoaded = useLibraryStore(s => s.isLoaded);
  const songs = useLibraryStore(s => s.songs);
  const scanLibrary = useLibraryStore(s => s.scanLibrary);

  useEffect(() => {
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

        // Only scan if not already loaded or if library is empty
        if (ok && (!isLoaded || songs.length === 0)) {
          Logger.info('AppBootstrap', 'Starting library scan');
          await scanLibrary();
          Logger.info('AppBootstrap', 'Library scan completed');
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
            <LottieView
              source={require('../../../assets/animations/scan.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
            <Text style={[Typography.title, styles.scanTitle]}>
              Indexing your library
            </Text>
            <Text style={[Typography.body, styles.scanCount]}>
              {scanProgress} files discovered
            </Text>
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

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: Colors.background },
  scan: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  scanInner: { paddingHorizontal: 16 },
  lottie: { width: 180, height: 180 },
  scanTitle: { color: Colors.textPrimary, marginTop: 12 },
  scanCount: { color: Colors.textSecondary, marginTop: 6 },
});
