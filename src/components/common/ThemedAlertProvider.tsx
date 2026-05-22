import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
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

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.xl,
  },
  title: { color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  message: { color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  actions: { gap: Spacing.sm },
  actionsCol: { flexDirection: 'column' },
  actionsRow: { flexDirection: 'row', gap: Spacing.md },
  btnBase: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnFlex: { flex: 1 },
  btnGhost: {
    backgroundColor: Colors.glassWhite,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  btnPrimaryWrap: { overflow: 'hidden', borderRadius: 16 },
  btnPrimary: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
});
