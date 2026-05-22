import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { SongRow } from '../../components/library/SongRow';
import { VideoCard } from '../../components/library/VideoCard';
import { PinPad } from '../../components/common/PinPad';

export function PrivateVaultScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const privatePin = useLibraryStore((s) => s.privatePin);
  const setPrivatePin = useLibraryStore((s) => s.setPrivatePin);
  const privateIds = useLibraryStore((s) => s.privateIds);
  const togglePrivateId = useLibraryStore((s) => s.togglePrivateId);
  const songs = useLibraryStore((s) => s.songs);
  const videos = useLibraryStore((s) => s.videos);

  const playSong = usePlayerStore((s) => s.playSong);

  // States
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'music' | 'videos'>('music');

  // Verify PIN or setup PIN
  const isSetupMode = privatePin === null;

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);

      // Check if complete
      if (nextPin.length === 4) {
        setTimeout(() => {
          if (isSetupMode) {
            setPrivatePin(nextPin);
            Alert.alert('Success', 'Private Vault PIN has been successfully set.');
            setPinInput('');
          } else {
            if (nextPin === privatePin) {
              setIsUnlocked(true);
              setPinInput('');
            } else {
              Alert.alert('Error', 'Incorrect PIN. Please try again.');
              setPinInput('');
            }
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  // Filtered Private Items
  const privateSongs = useMemo(() => {
    return songs.filter((s) => privateIds.includes(s.id));
  }, [songs, privateIds]);

  const privateVideos = useMemo(() => {
    return videos.filter((v) => privateIds.includes(v.id));
  }, [videos, privateIds]);

  // Actions
  const handleRestore = (id: string, name: string) => {
    Alert.alert(
      'Restore Media',
      `Do you want to restore "${name}" back to the main library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => {
            togglePrivateId(id);
          },
        },
      ]
    );
  };

  if (!isUnlocked && !isSetupMode) {
    return (
      <PinPad
        icon="lock-outline"
        iconColor={Colors.accent1}
        title="Enter PIN"
        subtitle="Access your secure files"
        pinLength={pinInput.length}
        onKeyPress={handleKeyPress}
        onDelete={handleDelete}
        onBackPress={() => navigation.goBack()}
      />
    );
  }

  if (isSetupMode) {
    return (
      <PinPad
        icon="shield-lock-outline"
        iconColor={Colors.accent2}
        title="Set Vault PIN"
        subtitle="Create a 4-digit PIN to secure your private media files"
        pinLength={pinInput.length}
        onKeyPress={handleKeyPress}
        onDelete={handleDelete}
        onBackPress={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={[Typography.subtitle, styles.backText]}>‹ Back</Text>
        </Pressable>
        <Text style={[Typography.title, styles.title]}>Private Vault</Text>
        <Pressable 
          onPress={() => {
            Alert.alert(
              'Reset PIN',
              'Are you sure you want to change your vault PIN? Current vault items will remain private.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  onPress: () => {
                    setPrivatePin(null);
                    setIsUnlocked(false);
                  },
                },
              ]
            );
          }}
          style={styles.resetBtn}
        >
          <MaterialCommunityIcons name="key-change" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => setActiveTab('music')}
          style={[styles.tab, activeTab === 'music' && styles.activeTab]}
        >
          <Text style={[Typography.subtitle, styles.tabText, activeTab === 'music' && styles.activeTabText]}>
            Music ({privateSongs.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('videos')}
          style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
        >
          <Text style={[Typography.subtitle, styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
            Videos ({privateVideos.length})
          </Text>
        </Pressable>
      </View>

      {/* List */}
      {activeTab === 'music' ? (
        <View style={styles.listWrap}>
          {privateSongs.length === 0 ? (
            <View style={styles.emptyView}>
              <MaterialCommunityIcons name="music-box-outline" size={48} color={Colors.textMuted} />
              <Text style={[Typography.body, styles.emptyText]}>No private music files</Text>
            </View>
          ) : (
            <FlashList
              data={privateSongs}
              estimatedItemSize={68}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SongRow
                  song={item}
                  active={false}
                  playing={false}
                  onPress={() => playSong(item, privateSongs)}
                  onLongPress={() => handleRestore(item.id, item.title)}
                  onAddQueue={() => {}}
                />
              )}
            />
          )}
        </View>
      ) : (
        <View style={styles.listWrap}>
          {privateVideos.length === 0 ? (
            <View style={styles.emptyView}>
              <MaterialCommunityIcons name="video-off-outline" size={48} color={Colors.textMuted} />
              <Text style={[Typography.body, styles.emptyText]}>No private video files</Text>
            </View>
          ) : (
            <FlashList
              data={privateVideos}
              numColumns={2}
              estimatedItemSize={200}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.videoCardWrapper}>
                  <VideoCard
                    item={item}
                    onOpen={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
                    onLongMenu={() => handleRestore(item.id, item.title)}
                  />
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  backText: { color: Colors.accent2, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  back: { paddingVertical: 4 },
  title: { color: Colors.textPrimary },
  resetBtn: { padding: 4 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.accent1 },
  tabText: { color: Colors.textMuted },
  activeTabText: { color: Colors.accent1 },
  listWrap: { flex: 1, paddingBottom: 80 },
  emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyText: { color: Colors.textMuted },
  videoCardWrapper: { flex: 0.5, marginHorizontal: 8, marginTop: 16 },
});
