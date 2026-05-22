import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomSheet } from '../common/BottomSheet';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BluetoothService, type BtDeviceInfo } from '../../services/BluetoothService';

type Props = {
  visible: boolean;
  onClose: () => void;
  devices: BtDeviceInfo[];
  onRefresh: () => void;
};

export function BluetoothSheet({
  visible,
  onClose,
  devices,
  onRefresh,
}: Props): React.ReactElement {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Bluetooth audio" heightFraction={0.55}>
      <Pressable onPress={() => onRefresh()} style={styles.refresh}>
        <Text style={[Typography.subtitle, styles.refreshText]}>Refresh</Text>
      </Pressable>
      <FlatList
        data={devices}
        keyExtractor={(d) => d.address}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => {
              if (item.connected) {
                BluetoothService.disconnect(item.address);
              } else {
                BluetoothService.connect(item.address);
              }
              onRefresh();
            }}>
            <MaterialCommunityIcons
              name={item.name.toLowerCase().includes('head') ? 'headphones' : 'speaker'}
              size={22}
              color={Colors.textPrimary}
            />
            <View style={styles.meta}>
              <Text style={[Typography.subtitle, styles.name]}>{item.name}</Text>
              <Text style={[Typography.caption, styles.status]}>
                {item.connected ? 'Connected' : 'Tap to connect'}
              </Text>
            </View>
            {item.connected ? (
              <View style={styles.dot}>
                <Text style={[Typography.micro, styles.dotText]}>●</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  refresh: { alignSelf: 'flex-end', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassBorder,
  },
  dot: { marginLeft: 8 },
  refreshText: { color: Colors.accent2 },
  listContent: { paddingBottom: 24 },
  meta: { flex: 1, marginLeft: 10 },
  name: { color: Colors.textPrimary },
  status: { color: Colors.textMuted },
  dotText: { color: Colors.success },
});
