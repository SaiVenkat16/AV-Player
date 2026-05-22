import type { TextStyle } from 'react-native';
import { Colors } from './colors';

/** Default `color` so Text is visible on dark backgrounds when callers omit it. */
export const Typography: Record<string, TextStyle> = {
  hero: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: Colors.textPrimary },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: Colors.textPrimary },
  subtitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  body: { fontSize: 13, fontWeight: '400', color: Colors.textPrimary },
  caption: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5, color: Colors.textPrimary },
  micro: { fontSize: 10, fontWeight: '600', letterSpacing: 1, color: Colors.textPrimary },
};
