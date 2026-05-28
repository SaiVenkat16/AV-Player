import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { GradientText } from '../common/GradientText';
import { useSearchStore } from '../../store/searchStore';
import { styles } from '../../styles/navigation/BottomTabNavigatorStyles';

type Props = {
  mode: 'audio' | 'video';
};

export const HomeHeader = React.memo(function HomeHeader({ mode }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const isSearchOpen = useSearchStore((s) => s.isSearchOpen);
  const searchQuery = useSearchStore((s) => s.query);
  const openSearch = useSearchStore((s) => s.openSearch);
  const closeSearch = useSearchStore((s) => s.closeSearch);
  const setQuery = useSearchStore((s) => s.setQuery);

  const isAudioTab = mode === 'audio';

  // Favorites and PrivateVault are registered on both stacks now, so we can
  // navigate within the active stack — no cross-tab jump.
  const goFavorites = () => navigation.navigate('Favorites', { mode });
  const goVault = () =>
    navigation.navigate('PrivateVault', { mode });

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {/* Row 1: App name + icons */}
      <View style={styles.titleRow}>
        <GradientText style={styles.appName}>AV PLAYER</GradientText>
        <View style={styles.headerIcons}>
          <Pressable
            style={styles.menuBtn}
            onPress={goFavorites}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="heart-outline" size={26} color={Colors.textPrimary} />
          </Pressable>
          <Pressable
            style={styles.menuBtn}
            onPress={goVault}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="folder-lock" size={26} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Row 2: Tabs or Search */}
      <View style={styles.navRow}>
        {isSearchOpen ? (
          <>
            <View style={styles.searchInputBar}>
              <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={isAudioTab ? 'Search audios...' : 'Search videos...'}
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
                </Pressable>
              )}
            </View>
            <Pressable style={styles.cancelBtn} onPress={closeSearch} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.textPrimary} />
            </Pressable>
          </>
        ) : (
          <>
            {isAudioTab ? (
              <>
                <Pressable style={styles.largeTabPill} onPress={openSearch}>
                  <Text style={styles.largeTabText}>Audios</Text>
                  <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
                </Pressable>
                <Pressable
                  style={styles.smallTabPill}
                  onPress={() => navigation.navigate('Videos')}
                >
                  <Text style={styles.smallTabText}>Videos</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={styles.smallTabPill}
                  onPress={() => navigation.navigate('Music')}
                >
                  <Text style={styles.smallTabText}>Audios</Text>
                </Pressable>
                <Pressable style={styles.largeTabPill} onPress={openSearch}>
                  <Text style={styles.largeTabText}>Videos</Text>
                  <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
                </Pressable>
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
});
