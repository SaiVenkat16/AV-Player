import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface PinPadProps {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  pinLength: number;
  onKeyPress: (num: string) => void;
  onDelete: () => void;
  onBackPress: () => void;
}

export const PinPad: React.FC<PinPadProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  pinLength,
  onKeyPress,
  onDelete,
  onBackPress,
}) => {
  return (
    <View style={styles.root}>
      <Pressable onPress={onBackPress} style={styles.backButton}>
        <Text style={[Typography.subtitle, styles.backText]}>‹ Back</Text>
      </Pressable>

      <View style={styles.pinWrapper}>
        <MaterialCommunityIcons name={icon} size={56} color={iconColor} />
        <Text style={[Typography.hero, styles.pinTitle]}>{title}</Text>
        <Text style={[Typography.caption, styles.pinSubtitle]}>{subtitle}</Text>

        {/* Dots Indicator */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                pinLength > index && styles.dotFilled,
              ]}
            />
          ))}
        </View>

        {/* Number Pad */}
        <View style={styles.padGrid}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <Pressable
              key={num}
              onPress={() => onKeyPress(num)}
              style={({ pressed }) => [styles.padBtn, pressed && styles.padBtnPressed]}
            >
              <Text style={styles.padBtnText}>{num}</Text>
            </Pressable>
          ))}
          <View style={styles.padBtnDummy} />
          <Pressable
            onPress={() => onKeyPress('0')}
            style={({ pressed }) => [styles.padBtn, pressed && styles.padBtnPressed]}
          >
            <Text style={styles.padBtnText}>0</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [styles.padBtn, pressed && styles.padBtnPressed]}
          >
            <MaterialCommunityIcons name="backspace-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  backButton: { position: 'absolute', top: 16, left: 16, zIndex: 10 },
  backText: { color: Colors.accent2, fontSize: 16 },
  pinWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 40,
  },
  pinTitle: { color: Colors.textPrimary, marginTop: 12 },
  pinSubtitle: { color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 16, marginVertical: 32 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dotFilled: { backgroundColor: Colors.accent1, borderColor: Colors.accent1 },
  padGrid: {
    width: '100%',
    maxWidth: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  padBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  padBtnPressed: { backgroundColor: 'rgba(255,255,255,0.1)' },
  padBtnText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  padBtnDummy: { width: 72, height: 72 },
});
