import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MusicTab } from '../screens/music/MusicTab';
import { NowPlayingScreen } from '../screens/music/NowPlayingScreen';
import { AlbumDetailScreen } from '../screens/music/AlbumDetailScreen';
import { ArtistDetailScreen } from '../screens/music/ArtistDetailScreen';
import { SearchScreen } from '../screens/shared/SearchScreen';
import { PlaylistScreen } from '../screens/shared/PlaylistScreen';
import { StatsScreen } from '../screens/shared/StatsScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { PrivateVaultScreen } from '../screens/shared/PrivateVaultScreen';

export type MusicStackParamList = {
  MusicHome: undefined;
  NowPlaying: undefined;
  AlbumDetail: { albumId: string };
  ArtistDetail: { artistId: string };
  Search: { mode: 'music' | 'video' };
  Playlist: { playlistId: string };
  Stats: undefined;
  Settings: undefined;
  PrivateVault: undefined;
};

const Stack = createNativeStackNavigator<MusicStackParamList>();

export function MusicStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#05050A' },
      }}>
      <Stack.Screen name="MusicHome" component={MusicTab} />
      <Stack.Screen
        name="NowPlaying"
        component={NowPlayingScreen}
        options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
      />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PrivateVault" component={PrivateVaultScreen} />
    </Stack.Navigator>
  );
}
