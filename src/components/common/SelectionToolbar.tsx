import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { styles } from '../../styles/components/common/SelectionToolbarStyles';

interface Props {
  count: number;
  onClose: () => void;
  onSelectAll: () => void;
  onShare: () => void;
  onDelete: () => void;
  showShare?: boolean;
}

export function SelectionToolbar({
  count,
  onClose,
  onSelectAll,
  onShare,
  onDelete,
  showShare = true,
}: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
      <Pressable onPress={onClose} hitSlop={10} style={styles.btn}>
        <MaterialCommunityIcons name="close" size={22} color={Colors.textPrimary} />
      </Pressable>
      <Text style={styles.count}>{count} selected</Text>
      <View style={styles.spacer} />
      <Pressable onPress={onSelectAll} hitSlop={10} style={styles.btn}>
        <MaterialCommunityIcons
          name="select-all"
          size={22}
          color={Colors.textPrimary}
        />
      </Pressable>
      {showShare && (
        <Pressable onPress={onShare} hitSlop={10} style={styles.btn}>
          <MaterialCommunityIcons
            name="share-variant"
            size={20}
            color={Colors.textPrimary}
          />
        </Pressable>
      )}
      <Pressable onPress={onDelete} hitSlop={10} style={styles.btn}>
        <MaterialCommunityIcons
          name="delete-outline"
          size={22}
          color={Colors.danger}
        />
      </Pressable>
    </View>
  );
}
