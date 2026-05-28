import React from 'react';
import { Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../../styles/components/video/GestureHUDStyles';

type Props = {
  visible: boolean;
  icon: string;
  label: string;
  barFraction: number;
  /**
   * Where on the screen to anchor the HUD card.
   * 'left'  → small bubble docked to the left edge (used for Brightness)
   * 'right' → small bubble docked to the right edge (used for Volume)
   * 'center' → large card in the middle (default — playback rate, bookmarks, etc.)
   */
  side?: 'left' | 'right' | 'center';
};

export function GestureHUD({
  visible,
  icon,
  label,
  barFraction,
  side = 'center',
}: Props): React.ReactElement | null {
  if (!visible) {
    return null;
  }

  const isSide = side === 'left' || side === 'right';
  const wrapStyle = [
    styles.wrap,
    side === 'left' && styles.wrapLeft,
    side === 'right' && styles.wrapRight,
  ];
  const cardStyle = isSide ? styles.cardSmall : styles.card;
  const iconSize = isSide ? 18 : 36;
  const trackStyle = isSide ? styles.trackSmall : styles.track;

  return (
    <View style={wrapStyle} pointerEvents="none">
      <View style={cardStyle}>
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color="#fff"
          style={styles.icon}
        />
        {!isSide && <Text style={styles.lab}>{label}</Text>}
        <View style={trackStyle}>
          <View
            style={[
              styles.fill,
              { height: `${Math.max(2, Math.round(barFraction * 100))}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}
