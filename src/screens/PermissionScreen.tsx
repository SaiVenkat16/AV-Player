import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AnimatedPressable } from '../components/common/AnimatedPressable';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

type Props = {
  onGrant: () => void;
};

export function PermissionScreen({ onGrant }: Props): React.ReactElement {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient colors={[Colors.background, '#0b0520']} style={styles.root}>
        <View style={styles.hero}>
          <LinearGradient colors={[...Colors.gradient2]} style={styles.img}>
            <MaterialCommunityIcons name="folder-music" size={72} color={Colors.textPrimary} />
          </LinearGradient>
        </View>
        <Text style={[Typography.hero, styles.title]}>Let AV Player see your media</Text>
        <Text style={[Typography.body, styles.sub]}>
          We only scan audio and video files on this device so you can play them offline. Nothing is
          uploaded.
        </Text>
        <AnimatedPressable onPress={onGrant} style={styles.btnWrap}>
          <LinearGradient colors={[...Colors.gradient1]} style={styles.btn}>
            <Text style={[Typography.subtitle, styles.btnT]}>Grant access</Text>
          </LinearGradient>
        </AnimatedPressable>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  root: { flex: 1, padding: 24, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 24 },
  img: {
    width: 160,
    height: 160,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  title: { color: Colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  sub: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 28 },
  btnWrap: { alignSelf: 'stretch' },
  btn: { borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  btnT: { color: Colors.textPrimary },
});
