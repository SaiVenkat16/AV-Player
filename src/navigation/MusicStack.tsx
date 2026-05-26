import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MusicTab } from '../screens/music/MusicTab';
import { NowPlayingScreen } from '../screens/music/NowPlayingScreen';
import { AlbumDetailScreen } from '../screens/music/AlbumDetailScreen';
import { AllAlbumsScreen } from '../screens/music/AllAlbumsScreen';
import { MusicFolderDetailScreen } from '../screens/music/MusicFolderDetailScreen';
import { SearchScreen } from '../screens/shared/SearchScreen';
import { PlaylistScreen } from '../screens/shared/PlaylistScreen';
import { PrivateVaultScreen } from '../screens/shared/PrivateVaultScreen';
import { FavoritesScreen } from '../screens/shared/FavoritesScreen';

export type MusicStackParamList = {
  MusicHome: undefined;
  NowPlaying: undefined;
  AlbumDetail: { albumId: string };
  AllAlbums: undefined;
  MusicFolderDetail: { folderPath: string; folderName: string };
  Search: { mode: 'music' | 'video' };
  Playlist: { playlistId: string };
  PrivateVault: { mode: 'audio' | 'video' };
  Favorites: undefined;
};

const Stack = createNativeStackNavigator<MusicStackParamList>();

export function MusicStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 150,
        contentStyle: { backgroundColor: '#05050A' },
      }}>
      <Stack.Screen name="MusicHome" component={MusicTab} />
      <Stack.Screen
        name="NowPlaying"
        component={NowPlayingScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 200, gestureEnabled: true }}
      />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <Stack.Screen name="AllAlbums" component={AllAlbumsScreen} />
      <Stack.Screen name="MusicFolderDetail" component={MusicFolderDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
      <Stack.Screen name="PrivateVault" component={PrivateVaultScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
    </Stack.Navigator>
  );
}
