import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { BottomTabNavigator } from './BottomTabNavigator';
import { Colors } from '../theme/colors';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.glassBorder,
    primary: Colors.accent1,
  },
};

export function RootNavigator(): React.ReactElement {
  return (
    <NavigationContainer theme={theme}>
      <BottomTabNavigator />
    </NavigationContainer>
  );
}
