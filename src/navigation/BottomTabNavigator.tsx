import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MusicStackNavigator } from './MusicStack';
import { VideoStackNavigator } from './VideoStack';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { styles } from '../styles/navigation/BottomTabNavigatorStyles';

export type MainTabParamList = {
  Music: undefined;
  Videos: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function BottomTabNavigator(): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Tab.Navigator
        tabBar={() => null}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tab.Screen name="Music" component={MusicStackNavigator} />
        <Tab.Screen name="Videos" component={VideoStackNavigator} />
      </Tab.Navigator>

      <MiniPlayer bottomInset={insets.bottom + 8} />
    </View>
  );
}
