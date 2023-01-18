import { styled } from 'nativewind';
import { View as ReactNativeView } from 'react-native';

export const Separator = styled(ReactNativeView, 'h-px w-[98%] self-center', {
  variants: {
    type: {
      retro: 'border-y border-t-borderDark border-b-borderLight',
      simple: 'border-b border-borderDarkest',
    },
  },
  defaultProps: {
    type: 'retro',
  },
});
