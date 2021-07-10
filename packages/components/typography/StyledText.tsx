import {
  backgroundColorShorthand,
  color,
  createRestyleComponent,
  createRestyleFunction,
  createVariant,
  layout,
  opacity,
  spacingShorthand,
  textShadow,
  visible,
} from '@shopify/restyle';
import { getKeys } from '@shopify/restyle/dist/typeHelpers';
import { Text, TextProps } from 'react-native';

import { Theme } from '../theme';
import {
  BackgroundColorProps,
  ColorProps,
  FontSizeProps,
  FontWeightProps,
  LayoutProps,
  LineHeightProps,
  OpacityProps,
  SpacingProps,
  TextShadowProps,
  TextVariantProps,
  typographyProperties,
  TypographyProps,
  VisibleProps,
} from '../types';

export type StyledTextProps = ColorProps &
  OpacityProps &
  VisibleProps &
  BackgroundColorProps &
  LayoutProps &
  TypographyProps &
  FontSizeProps &
  FontWeightProps &
  LineHeightProps &
  SpacingProps &
  TextShadowProps &
  TextVariantProps;

const fontSize = createRestyleFunction({
  property: 'fontSize',
  themeKey: 'fontSizes',
});

const lineHeight = createRestyleFunction({
  property: 'lineHeight',
  themeKey: 'lineHeights',
});

const fontWeight = createRestyleFunction({
  property: 'fontWeight',
  themeKey: 'fontWeights',
});

const typography = getKeys(typographyProperties).map((property) =>
  createRestyleFunction({
    property,
  }),
);

export type Props = StyledTextProps &
  Omit<TextProps, keyof StyledTextProps> & { children?: React.ReactNode };

export const textRestyleFunctions = [
  color,
  opacity,
  visible,
  spacingShorthand,
  backgroundColorShorthand,
  layout,
  textShadow,
  typography,
  fontSize,
  lineHeight,
  fontWeight,
  createVariant({ themeKey: 'textVariants' }),
];

export const StyledText = createRestyleComponent<Props, Theme>(
  textRestyleFunctions,
  Text,
);

StyledText.defaultProps = {
  variant: 'default',
};
