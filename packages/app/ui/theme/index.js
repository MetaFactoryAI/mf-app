/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-check
const { toRadixVar, toRadixVars } = require('windy-radix-palette/vars');

/**
 * Generates CSS variables for given set of colors
 * @param {{ [s: string]: { [s: string]: any; } | string; }} colors */
const createAliasColorVariables = (colors) => {
  /** @type {{ [s: string]: any; }} */
  let colorMap = {};

  for (const [colorName, colorObj] of Object.entries(colors)) {
    if (typeof colorObj === 'string') {
      colorMap[`--${colorName}`] = colorObj;
    } else if (colorObj) {
      for (const [key, value] of Object.entries(colorObj)) {
        colorMap[`--${colorName}${key}`] = value;
      }
    }
  }

  return colorMap;
};

/** @param {{ [s: string]: any; }} aliases */
const createAliasTheme = (aliases) => {
  /** @type {{ [s: string]: { [s: string]: any; } | string; }} */
  const themeColors = {};

  for (const [colorName, colorObj] of Object.entries(aliases)) {
    if (typeof colorObj === 'string') {
      themeColors[colorName] = `var(--${colorName})`;
    } else if (colorObj) {
      themeColors[colorName] = toRadixVars(colorName);
    }
  }

  return themeColors;
};

const aliasLightColors = {
  appBg: toRadixVar('gray', 1),
  appBgSubtle: toRadixVar('gray', 2),
  panel: toRadixVar('gray', 3),
  panelHover: toRadixVar('gray', 4),
  shadow: toRadixVar('grayA', 3),
  overlay: toRadixVar('blackA', 8),
  border: toRadixVar('gray', 6),
  text: toRadixVar('gray', 12),
  subtleText: toRadixVar('gray', 11),
  brand: toRadixVars('teal'),
};

const aliasDarkColors = {
  ...aliasLightColors,
  shadow: toRadixVar('blackA', 12),
  overlay: toRadixVar('blackA', 12),
};

const lightColorVariables = createAliasColorVariables({
  ...aliasLightColors,
});
const darkColorVariables = createAliasColorVariables({
  ...aliasDarkColors,
});

const aliasTheme = createAliasTheme(aliasLightColors);

/** @type {import('tailwindcss').Config['theme']} */
const theme = {
  extend: {
    padding: {
      retro: '7px 20px 5px',
      retroActive: '8px 20px 4px',
    },
    boxShadow: {
      retro:
        'inset 1px 1px 0px 1px var(--whiteA11), inset 0 0 0 1px var(--blackA9), 1px 1px 0 0px var(--blackA12)',
      retroFocus:
        'inset 1px 1px 0px 1px var(--whiteA11), inset -0.5px -0.5px 0px 1px var(--blackA9), 1px 1px 0 1px var(--blackA12)',
      retroActive: 'inset 0 0 0 1px var(--blackA9), 0 0 0 1px var(--blackA12)',
    },
    colors: {
      ...aliasTheme,
      brand: toRadixVars('lime'),
      brandText: toRadixVar('lime', 11),
      brandTextContrast: toRadixVar('lime', 11),
      brandBg: toRadixVar('lime', 4),
      brandBgHover: toRadixVar('lime', 5),
      brandBgActive: toRadixVar('lime', 6),
      grayText: toRadixVar('gray', 11),
      grayTextContrast: toRadixVar('gray', 12),
      grayBg: toRadixVar('gray', 3),
      grayBgHover: toRadixVar('gray', 4),
      grayBgActive: toRadixVar('gray', 5),
      grayBorder: toRadixVar('gray', 7),
      grayBorderHover: toRadixVar('gray', 8),
    },
    spacing: {
      'nav-height': '72px',
    },
  },
  borderRadius: {
    none: '0',
    sm: 'var(--border-sm)',
    DEFAULT: 'var(--border-md)',
    md: 'var(--border-md)',
    lg: 'var(--border-lg)',
    full: '9999px',
  },
  variables: {
    ...lightColorVariables,
  },
  darkVariables: {
    ...darkColorVariables,
  },
};

module.exports = {
  theme,
};
