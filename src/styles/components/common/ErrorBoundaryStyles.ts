import { StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';
import { Typography } from '../../../theme/typography';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    ...Typography.heading1,
    color: Colors.danger,
    marginBottom: 12,
  },
  errorMessage: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
