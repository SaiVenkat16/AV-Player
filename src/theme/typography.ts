import type { TextStyle } from 'react-native';
import { Colors } from './colors';

/** Default `color` so Text is visible on dark backgrounds when callers omit it. */
export const Typography: Record<string, TextStyle> = {
  hero: { fontSize: 28, fontFamily: 'Poppins-ExtraBold', letterSpacing: -0.5, color: Colors.textPrimary },
  title: { fontSize: 18, fontFamily: 'Poppins-Bold', letterSpacing: -0.3, color: Colors.textPrimary },
  subtitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary },
  body: { fontSize: 13, fontFamily: 'Poppins-Regular', color: Colors.textPrimary },
  caption: { fontSize: 11, fontFamily: 'Poppins-Medium', letterSpacing: 0.5, color: Colors.textPrimary },
  micro: { fontSize: 10, fontFamily: 'Poppins-SemiBold', letterSpacing: 1, color: Colors.textPrimary },
};
