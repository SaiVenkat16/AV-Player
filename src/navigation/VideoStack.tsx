import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VideoTab } from '../screens/video/VideoTab';
import { VideoFolderScreen } from '../screens/video/VideoFolderScreen';
import { SearchScreen } from '../screens/shared/SearchScreen';

export type VideoStackParamList = {
  VideoHome: undefined;
  VideoPlayer: { videoId: string };
  VideoFolderDetail: { folderPath: string; folderName: string };
  Search: { mode: 'music' | 'video' };
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
    </Stack.Navigator>
  );
}
