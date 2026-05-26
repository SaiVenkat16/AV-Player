import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../../../styles/components/video/EmbeddedVideoPlayerStyles';

interface DictionaryCardProps {
  word: string;
  meaning: string | null;
  onClose: () => void;
  onResume: () => void;
}

export function DictionaryCard({
  word,
  meaning,
  onClose,
  onResume,
}: DictionaryCardProps): React.ReactElement {
  const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '');

  return (
    <View style={styles.dictCard}>
      <View style={styles.dictHeader}>
        <Text style={styles.dictTitle}>Lookup: "{cleanWord}"</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={20} color="#fff" />
        </Pressable>
      </View>
      <Text style={styles.dictText}>{meaning}</Text>
      <View style={styles.dictFooter}>
        <Pressable onPress={onResume} style={styles.resumeBtn}>
          <Text style={styles.resumeBtnText}>Resume Play</Text>
        </Pressable>
      </View>
    </View>
  );
}
