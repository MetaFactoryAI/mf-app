import { styled } from 'nativewind';
import { View as ReactNativeView } from 'react-native';

export const Box = styled(ReactNativeView, {
  variants: {
    frame: {
      true: 'border border-gray-12 outline-blackA-12 outline-1 shadow-retro',
    },
  },
});
