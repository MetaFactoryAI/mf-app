import { useHeaderHeight } from '@react-navigation/stack';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, BoxProps } from './Box';

export type Props = BoxProps & {
  safeAreaBottom?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export const ScreenContainer: React.FC<Props> = ({
  children,
  safeAreaBottom = true,
  containerStyle: propsContainerStyle,
  ...props
}) => {
  const headerHeight = useHeaderHeight();
  const containerStyle: ViewStyle = {};
  const insets = useSafeAreaInsets();

  if (!headerHeight) {
    containerStyle.paddingTop = insets.top;
  }

  if (safeAreaBottom) {
    containerStyle.marginBottom = insets.bottom;
  }

  return (
    <Box flex={1} bg="shapeBg" centered {...props}>
      <Box
        flex={1}
        contentContainer
        style={[containerStyle, propsContainerStyle]}
        alignItems="stretch"
      >
        {children}
      </Box>
    </Box>
  );
};
