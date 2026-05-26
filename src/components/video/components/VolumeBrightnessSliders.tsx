import React from 'react';
import { Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../../../styles/components/video/EmbeddedVideoPlayerStyles';
import { Colors } from '../../../theme/colors';

interface VolumeBrightnessSlidersProps {
  volume: number;
  brightness: number;
}

export function VolumeBrightnessSliders({
  volume,
  brightness,
}: VolumeBrightnessSlidersProps): React.ReactElement {
  return (
    <View style={styles.sideSlidersContainer} pointerEvents="box-none">
      {/* Brightness Slider (Left side) */}
      <View style={styles.verticalSlider}>
        <MaterialCommunityIcons name="sun-angle-outline" size={16} color="#fff" />
        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              { height: `${brightness * 100}%`, backgroundColor: Colors.accent2 },
            ]}
          />
        </View>
        <Text style={styles.sliderValueText}>{Math.round(brightness * 100)}</Text>
      </View>

      {/* Volume Slider (Right side) */}
      <View style={styles.verticalSlider}>
        <MaterialCommunityIcons name="volume-high" size={16} color="#fff" />
        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              { height: `${volume * 100}%`, backgroundColor: Colors.accent1 },
            ]}
          />
        </View>
        <Text style={styles.sliderValueText}>{Math.round(volume * 100)}</Text>
      </View>
    </View>
  );
}
