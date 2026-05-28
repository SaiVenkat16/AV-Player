import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VideoTab } from '../screens/video/VideoTab';
import { VideoFolderScreen } from '../screens/video/VideoFolderScreen';
import { SearchScreen } from '../screens/shared/SearchScreen';
import { PrivateVaultScreen } from '../screens/shared/PrivateVaultScreen';
import { FavoritesScreen } from '../screens/shared/FavoritesScreen';

export type VideoStackParamList = {
  VideoHome: undefined;
  VideoFolderDetail: { folderPath: string; folderName: string };
  Search: { mode: 'music' | 'video' };
  PrivateVault: { mode: 'audio' | 'video' };
  Favorites: { mode: 'audio' | 'video' } | undefined;
};

const Stack = createNativeStackNavigator<VideoStackParamList>();

export function VideoStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#05050A' },
        animation: 'fade',
        animationDuration: 150,
      }}>
      <Stack.Screen name="VideoHome" component={VideoTab} />
      <Stack.Screen name="VideoFolderDetail" component={VideoFolderScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="PrivateVault" component={PrivateVaultScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
    </Stack.Navigator>
  );
}
