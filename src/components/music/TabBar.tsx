import React from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { styles } from '../../styles/components/music/TabBarStyles';

export type Tab = 'songs' | 'albums' | 'artists' | 'categories';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'songs', label: 'Songs', icon: 'music-note' },
  { key: 'albums', label: 'Albums', icon: 'album' },
  { key: 'artists', label: 'Artists', icon: 'account-music' },
  { key: 'categories', label: 'Categories', icon: 'tag-multiple' },
];

interface TabBarProps {
  active: Tab;
  onChange: (t: Tab) => void;
}

export function TabBar({ active, onChange }: TabBarProps): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBarScroll}
      contentContainerStyle={styles.tabBarContent}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Pressable key={t.key} style={styles.tabItem} onPress={() => onChange(t.key)}>
            <MaterialCommunityIcons
              name={t.icon}
              size={16}
              color={isActive ? Colors.accent1 : Colors.textMuted}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {t.label}
            </Text>
            {isActive && <View style={styles.tabUnderline} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
