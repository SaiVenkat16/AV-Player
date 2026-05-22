declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import type { ComponentType } from 'react';
  import type { StyleProp, TextStyle } from 'react-native';

  export type MaterialCommunityIconsProps = {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
    onPress?: () => void;
  };

  const Icon: ComponentType<MaterialCommunityIconsProps>;
  export default Icon;
}
