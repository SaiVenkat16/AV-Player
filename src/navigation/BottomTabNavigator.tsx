import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MusicStackNavigator } from './MusicStack';
import { VideoStackNavigator } from './VideoStack';
import { Colors } from '../theme/colors';
import { MiniPlayer } from '../components/player/MiniPlayer';

export type MainTabParamList = {
  Music: undefined;
  Videos: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_HEIGHT = 60;

const getTabBarIcon = (routeName: keyof MainTabParamList, color: string, size: number) => {
  let iconName = '';
  if (routeName === 'Music') {
    iconName = 'music-note';
  } else if (routeName === 'Videos') {
    iconName = 'movie-play';
  }
  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
};

export function BottomTabNavigator(): React.ReactElement {
  const insets = useSafeAreaInsets();
  
  const bottomHeight = useMemo(() => {
    return TAB_BAR_HEIGHT + insets.bottom;
  }, [insets.bottom]);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: [styles.tabBar, { height: bottomHeight, paddingBottom: insets.bottom }],
          tabBarActiveTintColor: Colors.accent1,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: styles.label,
          tabBarIcon: ({ color, size }) => getTabBarIcon(route.name, color, size),
        })}>
        <Tab.Screen name="Music" component={MusicStackNavigator} />
        <Tab.Screen name="Videos" component={VideoStackNavigator} />
      </Tab.Navigator>
      
      {/* MiniPlayer sits above the tab bar */}
      <MiniPlayer bottomInset={bottomHeight + 8} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
});
