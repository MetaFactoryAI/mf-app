import * as restyle from '@shopify/restyle';
import { TextStyle } from 'react-native';

import { Theme } from './theme';

export type ResponsiveProps<Theme extends restyle.BaseTheme, Props> = {
  [P in keyof Props]?: restyle.ResponsiveValue<Props[P], Theme>;
};

export const typographyProperties = {
  fontFamily: true,
  fontWeight: true,
  fontStyle: true,
  letterSpacing: true,
  textAlign: true,
  textDecorationLine: true,
  textDecorationStyle: true,
  textTransform: true,
};

export type TypographyProps = {
  [Key in keyof typeof typographyProperties]?: restyle.ResponsiveValue<
    TextStyle[Key],
    Theme
  >;
};

export type LayoutProps = restyle.LayoutProps<Theme>;
export type VisibleProps = restyle.VisibleProps<Theme>;
export type OpacityProps = restyle.OpacityProps<Theme>;
export type SpacingProps = restyle.SpacingShorthandProps<Theme>;
export type ShadowProps = restyle.ShadowProps<Theme>;
export type PositionProps = restyle.PositionProps<Theme>;
export type BackgroundColorProps =
  restyle.BackgroundColorShorthandProps<Theme> &
    restyle.BackgroundColorProps<Theme>;
export type BorderProps = restyle.BorderProps<Theme>;
export type ColorProps = restyle.ColorProps<Theme>;
export type TextVariantProps = restyle.VariantProps<Theme, 'textVariants'>;

export type TextShadowProps = restyle.TextShadowProps<Theme>;

export type TextType = TextVariantProps['variant'];
export type Size = restyle.ResponsiveValue<keyof Theme['sizes'], Theme>;
export type FontSize = restyle.ResponsiveValue<keyof Theme['fontSizes'], Theme>;

export interface FontSizeProps {
  fontSize?: restyle.ResponsiveValue<keyof Theme['fontSizes'], Theme>;
}

export interface FontWeightProps {
  fontWeight?: restyle.ResponsiveValue<keyof Theme['fontWeights'], Theme>;
}

export interface LineHeightProps {
  lineHeight?: restyle.ResponsiveValue<keyof Theme['lineHeights'], Theme>;
}

export type FontWeight = FontWeightProps['fontWeight'];

export type Color = ColorProps['color'];
