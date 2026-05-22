import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { BtDeviceInfo } from '../../services/BluetoothService';

type Props = {
  devices: BtDeviceInfo[];
  onPress: () => void;
};

export function BluetoothIndicator({ devices, onPress }: Props): React.ReactElement {
  const connected = devices.find((d) => d.connected);
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <MaterialCommunityIcons
        name="bluetooth"
        size={22}
        color={connected ? Colors.accent2 : Colors.textMuted}
        style={connected ? styles.glow : undefined}
      />
      {connected ? (
        <Text numberOfLines={1} style={[Typography.caption, styles.name]}>
          {connected.name}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', maxWidth: 160 },
  glow: { textShadowColor: Colors.accent2, textShadowRadius: 8 },
  name: { color: Colors.textSecondary, marginLeft: 4 },
});
