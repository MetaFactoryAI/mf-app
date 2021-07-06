import {
  backgroundColor,
  backgroundColorShorthand,
  border,
  createRestyleComponent,
  layout,
  opacity,
  position,
  shadow,
  spacingShorthand,
  visible,
} from '@shopify/restyle';
import React from 'react';
import { View } from 'react-native';

import { Theme } from '../theme';
import {
  BackgroundColorProps,
  BorderProps,
  LayoutProps,
  OpacityProps,
  PositionProps,
  ShadowProps,
  SpacingProps,
  VisibleProps,
} from '../types';

export type BoxStyleProps = BackgroundColorProps &
  OpacityProps &
  VisibleProps &
  LayoutProps &
  SpacingProps &
  BorderProps &
  ShadowProps &
  PositionProps;

export const boxRestyleFunctions = [
  backgroundColor,
  backgroundColorShorthand,
  opacity,
  visible,
  layout,
  spacingShorthand,
  border,
  shadow,
  position,
];

// Allows any component to adopt restyle style props
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createBox<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component extends React.ComponentType<any> = typeof View,
>(BaseComponent?: Component) {
  return createRestyleComponent<
    BoxStyleProps &
      Omit<
        React.ComponentProps<Component> & { children?: React.ReactNode },
        keyof BoxStyleProps
      > & {
        children?: React.ReactNode;
      },
    Theme
  >(boxRestyleFunctions, BaseComponent || View);
}
