import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  registerThemedAlertHost,
  type ThemedAlertButton,
  type ThemedAlertOptions,
} from '../../utils/themedAlert';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { styles } from '../../styles/components/common/ThemedAlertProviderStyles';

type Props = { children: React.ReactNode };

export function ThemedAlertProvider({ children }: Props): React.ReactElement {
  const [payload, setPayload] = useState<ThemedAlertOptions | null>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    registerThemedAlertHost(setPayload);
    return () => registerThemedAlertHost(null);
  }, []);

  const close = useCallback(() => {
    setPayload(null);
  }, []);

  const onButtonPress = useCallback(
    (btn: ThemedAlertButton) => {
      try {
        btn.onPress?.();
      } finally {
        close();
      }
    },
    [close],
  );

  const buttons = payload?.buttons ?? [];
  const twoRow = buttons.length === 2;

  return (
    <>
      {children}
      <Modal
        visible={payload != null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          const cancel = buttons.find((b) => b.style === 'cancel');
          if (cancel) {
            onButtonPress(cancel);
          } else {
            close();
          }
        }}>
        <View style={styles.scrim}>
          <View style={[styles.card, { maxWidth: Math.min(360, width - Spacing.xxl * 2) }]}>
            {payload?.title ? (
              <Text style={[Typography.title, styles.title]}>{payload.title}</Text>
            ) : null}
            {payload?.message ? (
              <Text style={[Typography.body, styles.message]}>{payload.message}</Text>
            ) : null}
            <View style={[styles.actions, twoRow ? styles.actionsRow : styles.actionsCol]}>
              {buttons.map((btn, i) => (
                <AlertActionButton
                  key={`${btn.text}-${i}`}
                  button={btn}
                  twoRow={twoRow}
                  onPress={() => onButtonPress(btn)}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function AlertActionButton({
  button,
  twoRow,
  onPress,
}: {
  button: ThemedAlertButton;
  twoRow: boolean;
  onPress: () => void;
}): React.ReactElement {
  const style = button.style ?? 'default';
  if (style === 'destructive') {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.btnBase, twoRow && styles.btnFlex, styles.btnGhost]}
        accessibilityRole="button">
        <Text style={[Typography.subtitle, { color: Colors.danger }]}>{button.text}</Text>
      </Pressable>
    );
  }
  if (style === 'cancel') {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.btnBase, twoRow && styles.btnFlex, styles.btnGhost]}
        accessibilityRole="button">
        <Text style={[Typography.subtitle, { color: Colors.textSecondary }]}>{button.text}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btnBase, twoRow && styles.btnFlex, styles.btnPrimaryWrap]}
      accessibilityRole="button">
      <LinearGradient colors={[...Colors.gradient1]} style={styles.btnPrimary}>
        <Text style={[Typography.subtitle, { color: Colors.textPrimary }]}>{button.text}</Text>
      </LinearGradient>
    </Pressable>
  );
}

