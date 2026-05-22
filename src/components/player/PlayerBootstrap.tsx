import React, { useEffect, useState } from 'react';
import { usePlayerBootstrap } from '../../hooks/usePlayer';
import { setupAudio } from '../../services/AudioService';

function PlayerBootstrapSynced(): React.ReactElement | null {
  usePlayerBootstrap();
  return null;
}

/** Must run setupPlayer before TrackPlayer hooks / getQueue — otherwise LogBox "Call setupPlayer first". */
export function PlayerBootstrap(): React.ReactElement | null {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setupAudio().then(() => {
      if (!cancelled) {
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }
  return <PlayerBootstrapSynced />;
}
