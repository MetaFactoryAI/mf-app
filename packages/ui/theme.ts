import {
  BaseTheme,
  ThemeProvider as RestyleThemeProvider,
  useTheme as useRestyleTheme,
} from '@shopify/restyle';
import { StyleSheet } from 'react-native';

export const ThemeProvider = RestyleThemeProvider;
export const createTheme = <T extends BaseTheme>(themeObject: T): T =>
  themeObject;

// Custom values
export const constants = {
  borderWidth: StyleSheet.hairlineWidth,
  minRowHeight: 40,
  maxButtonWidth: 350,
  maxContentWidth: 450,
};

export const sizes = {
  s: 16,
  m: 24, // < default
  l: 36,
  xl: 60,
  '2xl': 90,
  '3xl': 140,
};

// Layout / Sizing
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

export const spacing = {
  0: 0,
  '2xs': 2,
  xs: 4,
  s: 8, // < base (content padding)
  m: 16, // screen margin
  l: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadii = {
  field: 10,
  button: 0,
  card: 12,
  rounded: 100,
};

const getColor = (color: string, opacity = 1) =>
  color.replace(
    /rgba?(\(\s*\d+\s*,\s*\d+\s*,\s*\d+)(?:\s*,.+?)?\)/,
    `rgba$1,${opacity})`,
  );

// Colors
const lightPalette = {
  blue: 'rgb(9,206,217)',
  red: 'rgb(255,59,48)',
  yellow: 'rgb(255,228,44)',
  green: 'rgb(79,230,95)',
  purple: 'rgb(131,32,235)',
  pink: 'rgb(230,0,176)',
};

const darkPalette: typeof lightPalette = {
  blue: 'rgb(0,236,255)',
  red: 'rgb(255,69,58)',
  yellow: 'rgb(255,238,54)',
  green: 'rgb(79,249,112)',
  purple: 'rgb(139,44,255)',
  pink: 'rgb(255,0,195)',
};

const grayPalette = {
  transparent: 'transparent',
  light: 'rgb(255,255,255)',
  lightGray: '#F4F4F4',
  gray: '#989898',
  darkGray: '#1C1C1E',
  oledDark: '#010101',
  dark: 'rgb(0,0,0)',
};

type Colors = typeof lightColors;

const PRIMARY_OPACITY = 0.95;
const SECONDARY_OPACITY = 0.6;
const DISABLED_OPACITY = 0.15;

const lightColors = {
  transparent: grayPalette.transparent,
  accent: lightPalette.blue,
  accentBg: getColor(lightPalette.blue, DISABLED_OPACITY),
  primaryContent: getColor(grayPalette.dark, PRIMARY_OPACITY),
  secondaryContent: getColor(grayPalette.dark, SECONDARY_OPACITY),
  disabledContent: getColor(grayPalette.dark, DISABLED_OPACITY),
  link: lightPalette.blue,

  // Buttons
  buttonSolidContent: getColor(grayPalette.light, PRIMARY_OPACITY),
  buttonPrimary: grayPalette.dark,
  buttonSecondary: getColor(grayPalette.dark, 0.5),
  buttonDisabled: getColor(grayPalette.dark, DISABLED_OPACITY),

  success: lightPalette.green,
  alert: lightPalette.yellow,
  error: lightPalette.red,

  bg: grayPalette.lightGray,
  shapeBg: grayPalette.light,
  shapeBgContrast: grayPalette.dark,
  translucentBg: getColor(grayPalette.light, PRIMARY_OPACITY),
  border: getColor(grayPalette.dark, PRIMARY_OPACITY),
};

const darkColors: Colors = {
  transparent: grayPalette.transparent,
  accent: darkPalette.blue,
  accentBg: getColor(darkPalette.blue, DISABLED_OPACITY),
  primaryContent: getColor(grayPalette.light, PRIMARY_OPACITY),
  secondaryContent: getColor(grayPalette.light, SECONDARY_OPACITY),
  disabledContent: getColor(grayPalette.light, DISABLED_OPACITY),
  link: darkPalette.blue,

  // Buttons
  buttonSolidContent: getColor(grayPalette.dark, PRIMARY_OPACITY),
  buttonPrimary: grayPalette.light,
  buttonSecondary: getColor(grayPalette.light, 0.6),
  buttonDisabled: getColor(grayPalette.light, DISABLED_OPACITY),

  success: darkPalette.green,
  alert: darkPalette.yellow,
  error: darkPalette.red,

  bg: grayPalette.oledDark,
  shapeBg: grayPalette.darkGray,
  shapeBgContrast: grayPalette.light,
  translucentBg: getColor(grayPalette.dark, PRIMARY_OPACITY),
  border: getColor(grayPalette.light, PRIMARY_OPACITY),
};

// Typography

const fontSizes = {
  '2xs': 11,
  xs: 13,
  s: 15,
  m: 17,
  l: 20,
  xl: 28,
  '2xl': 34,
  '3xl': 48,
};

const lineHeights = {
  0: 0,
  '2xs': 15,
  xs: 17,
  s: 20,
  m: 22,
  l: 26,
  xl: 32,
  '2xl': 40,
  '3xl': 54,
};

export const fontWeights = {
  normal: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

const zIndices = {
  up: 1,
  down: -1,
};

// const getLetterSpacing = (fontSize: number) => -fontSize * 0.03;

const textVariants = {
  headerLarge: {
    fontSize: fontSizes['3xl'],
    // letterSpacing: getLetterSpacing(fontSizes['3xl']),
    lineHeight: lineHeights['3xl'],
    fontWeight: fontWeights.bold,
    color: 'primaryContent',
  },
  header: {
    fontSize: fontSizes['2xl'],
    // letterSpacing: getLetterSpacing(fontSizes['2xl']),
    lineHeight: lineHeights['2xl'],
    fontWeight: fontWeights.bold,
    color: 'primaryContent',
  },
  headerSmall: {
    fontSize: fontSizes.l,
    // letterSpacing: getLetterSpacing(fontSizes.l),
    lineHeight: lineHeights.l,
    fontWeight: fontWeights.semiBold,
    color: 'primaryContent',
  },
  caption: {
    fontSize: fontSizes.xs,
    // letterSpacing: getLetterSpacing(fontSizes.xs),
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.normal,
    color: 'secondaryContent',
  },
  label: {
    fontSize: fontSizes.s,
    // letterSpacing: getLetterSpacing(fontSizes.s),
    lineHeight: lineHeights.s,
    fontWeight: fontWeights.semiBold,
    color: 'primaryContent',
  },
  tag: {
    fontSize: fontSizes['2xs'],
    // letterSpacing: getLetterSpacing(fontSizes.xs),
    lineHeight: lineHeights['2xs'],
    fontWeight: fontWeights.semiBold,
    color: 'primaryContent',
  },
  default: {
    fontSize: fontSizes.m,
    // letterSpacing: getLetterSpacing(fontSizes.m),
    lineHeight: lineHeights.m,
    fontWeight: fontWeights.normal,
    color: 'primaryContent',
  },
  body: {
    fontSize: fontSizes.s,
    // letterSpacing: getLetterSpacing(fontSizes.s),
    lineHeight: lineHeights.s,
    fontWeight: fontWeights.normal,
    color: 'primaryContent',
  },
};

const buttonVariants = {
  base: {
    minHeight: constants.minRowHeight,
    maxWidth: {
      desktop: constants.maxButtonWidth,
    },
  },
  pill: {
    fontSize: fontSizes.s,
    minHeight: 28,
    borderRadius: 'rounded',
  },
  circle: {
    aspectRatio: 1,
    borderRadius: 'rounded',
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    width: sizes.l,
    height: sizes.l,
  },
};

export const defaultLightTheme = createTheme({
  spacing,
  breakpoints,
  colors: lightColors,
  sizes,
  fontSizes,
  lineHeights,
  zIndices,
  fontWeights,
  borderRadii,
  constants,
  textVariants,
  buttonVariants,
});

export type Theme = typeof defaultLightTheme;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useTheme = () => useRestyleTheme<Theme>();

export const defaultDarkTheme: Theme = {
  ...defaultLightTheme,
  colors: darkColors,
};
