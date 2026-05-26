import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  text: { backgroundColor: 'transparent' },
  /** Opaque mask glyph — required for MaskedView on some Android builds. */
  maskFill: { color: '#000000' },
  hidden: { opacity: 0 },
});
