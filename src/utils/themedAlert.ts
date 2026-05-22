export type ThemedAlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type ThemedAlertButton = {
  text: string;
  style?: ThemedAlertButtonStyle;
  onPress?: () => void;
};

export type ThemedAlertOptions = {
  title?: string;
  message?: string;
  buttons?: ThemedAlertButton[];
};

type Handler = (payload: ThemedAlertOptions | null) => void;

let handler: Handler | null = null;

export function registerThemedAlertHost(next: Handler | null): void {
  handler = next;
}

export function showThemedAlert(options: ThemedAlertOptions): void {
  const buttons =
    options.buttons && options.buttons.length > 0
      ? options.buttons
      : [{ text: 'OK', style: 'default' as const }];
  handler?.({ ...options, buttons });
}

export function hideThemedAlert(): void {
  handler?.(null);
}
