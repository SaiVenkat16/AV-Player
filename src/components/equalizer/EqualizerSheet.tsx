import React from 'react';
import { Modal, Pressable, Switch, Text, View } from 'react-native';
import { Platform, Vibration } from 'react-native';
import { EQSlider } from './EQSlider';
import { PresetSelector } from './PresetSelector';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useEqualizerStore } from '../../store/equalizerStore';
import { styles } from '../../styles/components/equalizer/EqualizerSheetStyles';

type Props = { visible: boolean; onClose: () => void };

const bandColors: readonly (readonly [string, string])[] = [
  [Colors.gradient1[0], Colors.gradient1[1]],
  [Colors.visualizerBars[0], Colors.visualizerBars[1]],
  [Colors.gradient2[0], Colors.gradient2[1]],
  [Colors.visualizerBars[2], Colors.visualizerBars[3]],
  [Colors.gradient3[0], Colors.gradient3[1]],
] as const;

function bumpHaptic(): void {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    Vibration.vibrate(10);
  }
}

export function EqualizerSheet({ visible, onClose }: Props): React.ReactElement {
  const bands = useEqualizerStore((s) => s.bands);
  const setBand = useEqualizerStore((s) => s.setBandGain);
  const applyPreset = useEqualizerStore((s) => s.applyPreset);
  const active = useEqualizerStore((s) => s.activePreset);
  const bass = useEqualizerStore((s) => s.bassBoost);
  const sur = useEqualizerStore((s) => s.surroundMode);
  const tb = useEqualizerStore((s) => s.toggleBassBoost);
  const ts = useEqualizerStore((s) => s.toggleSurround);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.modal} onStartShouldSetResponder={() => true}>
            <Text style={styles.title}>Equalizer</Text>

            <PresetSelector
              active={active}
              onSelect={(n) => {
                bumpHaptic();
                applyPreset(n);
              }}
            />

            <View style={styles.bands}>
              {bands.map((b, i) => (
                <EQSlider
                  key={b.hz}
                  label={`${b.hz < 1000 ? b.hz : b.hz / 1000}${b.hz < 1000 ? 'Hz' : 'k'}`}
                  value={b.gain}
                  onChange={(g) => setBand(i, g)}
                  colors={bandColors[i % bandColors.length] as readonly [string, string]}
                />
              ))}
            </View>

            <View style={styles.row}>
              <Text style={[Typography.subtitle, styles.rowLabel]}>Bass boost</Text>
              <Switch value={bass} onValueChange={() => tb()} thumbColor={Colors.accent3} />
            </View>
            <View style={styles.row}>
              <Text style={[Typography.subtitle, styles.rowLabel]}>3D surround</Text>
              <Switch value={sur} onValueChange={() => ts()} thumbColor={Colors.accent1} />
            </View>
          </View>
        </Pressable>
    </Modal>
  );
}

