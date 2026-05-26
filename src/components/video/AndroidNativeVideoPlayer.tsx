import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { openNativeVideoPlayer } from '../../services/NativeVideoPlayer';
import { styles } from '../../styles/components/video/AndroidNativeVideoPlayerStyles';

interface AndroidNativeVideoPlayerProps {
  uri: string;
  onDone: () => void;
  onFail: (message: string) => void;
}

export function AndroidNativeVideoPlayer({
  uri,
  onDone,
  onFail,
}: AndroidNativeVideoPlayerProps): React.ReactElement {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    (async () => {
      try {
        await openNativeVideoPlayer(uri);
        onDone();
      } catch (e) {
        onFail(e instanceof Error ? e.message : 'Could not open video');
      }
    })();
  }, [uri, onDone, onFail]);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <ActivityIndicator size="large" color={Colors.accent1} />
      <Text style={styles.loadingText}>Opening player…</Text>
    </View>
  );
}
