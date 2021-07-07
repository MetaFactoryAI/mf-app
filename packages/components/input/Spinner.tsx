import { useResponsiveProp, useTheme } from '@shopify/restyle';
import * as React from 'react';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';

import { Theme } from '../theme';
import { Color } from '../types';

export type Props = Omit<ActivityIndicatorProps, 'color'> & {
  color?: Color;
};

export const Spinner: React.FC<Props> = ({
  color,
  size = 'small',
  ...props
}) => {
  const colorProp = useResponsiveProp(color) || 'secondaryContent';
  const theme = useTheme<Theme>();

  return (
    <ActivityIndicator size={size} color={theme.colors[colorProp]} {...props} />
  );
};
