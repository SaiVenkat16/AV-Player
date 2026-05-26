import React from 'react';
import { Text, View, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Typography } from '../../theme/typography';
import { styles } from '../../styles/components/common/PinPadStyles';

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
      <Pressable onPress={onBackPress} style={styles.backButton} hitSlop={12}>
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

