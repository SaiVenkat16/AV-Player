import React from 'react';
import { LayoutAnimation, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MusicStackParamList } from '../../navigation/MusicStack';
import { GradientText } from '../common/GradientText';
import { BluetoothIndicator } from '../bluetooth/BluetoothIndicator';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { BtDeviceInfo } from '../../services/BluetoothService';

interface MusicHeaderProps {
  devices: BtDeviceInfo[];
  onBtPress: () => void;
  onSearchPress: () => void;
  onRefreshPress: () => void;
}

export function MusicHeader({
  devices,
  onBtPress,
  onSearchPress,
  onRefreshPress,
}: MusicHeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MusicStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {/* Title is absolutely centered */}
      <View style={styles.centerAbsolute} pointerEvents="none">
        <GradientText style={Typography.hero}>Music</GradientText>
      </View>

      <View style={styles.headerLeft}>
        <MaterialCommunityIcons
          name="cog-outline"
          size={24}
          color={Colors.textPrimary}
          style={styles.iconLeft}
          onPress={() => navigation.navigate('Settings')}
        />
        <MaterialCommunityIcons
          name="chart-bar"
          size={24}
          color={Colors.textPrimary}
          style={styles.iconLeft}
          onPress={() => navigation.navigate('Stats')}
        />
      </View>

      <View style={styles.headerRight}>
        <MaterialCommunityIcons
          name="refresh"
          size={24}
          color={Colors.textPrimary}
          style={styles.icon}
          onPress={onRefreshPress}
        />
        <BluetoothIndicator devices={devices} onPress={onBtPress} />
        <MaterialCommunityIcons
          name="magnify"
          size={24}
          color={Colors.textPrimary}
          style={styles.icon}
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            onSearchPress();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  centerAbsolute: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconLeft: {
    marginRight: 14,
    padding: 4,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  icon: {
    marginLeft: 14,
    padding: 4,
  },
});
