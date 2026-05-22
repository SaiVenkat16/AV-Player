import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import { useSettingsStore } from '../../store/settingsStore';

type Nav = NativeStackNavigationProp<MusicStackParamList>;

export function SettingsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const crossfade = useSettingsStore((s) => s.crossfadeMs);
  const setCf = useSettingsStore((s) => s.setCrossfadeMs);
  const vis = useSettingsStore((s) => s.visualizerStyle);
  const setVis = useSettingsStore((s) => s.setVisualizerStyle);
  return (
    <View style={styles.root}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={[Typography.subtitle, styles.backText]}>‹ Back</Text>
      </Pressable>
      <Text style={[Typography.hero, styles.t]}>Settings</Text>
      <Row label={`Crossfade (${crossfade} ms)`} onPress={() => setCf(crossfade >= 8000 ? 0 : crossfade + 1000)}>
        <Text style={styles.adjustText}>Adjust</Text>
      </Row>
      <Row label="Private Vault" onPress={() => navigation.navigate('PrivateVault')}>
        <Text style={styles.adjustText}>Open</Text>
      </Row>
      <Row label="Visualizer style: bars" onPress={() => setVis('bars')}>
        <Text style={styles.setText}>Set</Text>
      </Row>
      <Row label="Visualizer: rings" onPress={() => setVis('rings')}>
        <Text style={styles.setText}>Set</Text>
      </Row>
      <Row label="Visualizer: particles" onPress={() => setVis('particles')}>
        <Text style={styles.setText}>Set</Text>
      </Row>
      <Row label="Visualizer: wave" onPress={() => setVis('wave')}>
        <Text style={styles.setText}>Current: {vis}</Text>
      </Row>
    </View>
  );
}

function Row({
  label,
  children,
  onPress,
}: {
  label: string;
  children?: React.ReactNode;
  onPress?: () => void;
}): React.ReactElement {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={[Typography.subtitle, styles.rowLabel]}>{label}</Text>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  t: { color: Colors.textPrimary, marginLeft: 16, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassBorder,
  },
  back: { padding: 16 },
  backText: { color: Colors.accent2 },
  adjustText: { color: Colors.accent2 },
  setText: { color: Colors.textSecondary },
  rowLabel: { color: Colors.textPrimary, flex: 1 },
});
