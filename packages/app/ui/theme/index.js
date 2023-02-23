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
  appBg: toRadixVar('gray', 9),
  appBgSubtle: toRadixVar('gray', 10),
  panel: toRadixVar('gray', 3),
  panelHover: toRadixVar('gray', 4),
  shadow: toRadixVar('grayA', 3),
  overlay: toRadixVar('blackA', 9),
  danger: toRadixVar('red', 9),
  success: toRadixVar('green', 9),

  grayBg: toRadixVar('gray', 9),
  grayBgSubtle: toRadixVar('gray', 10),
  grayBgHover: toRadixVar('gray', 9),
  grayBgActive: toRadixVar('gray', 10),
  grayText: toRadixVar('gray', 12),
  grayDivider: toRadixVar('gray', 11),
  grayTextSubtle: toRadixVar('gray', 11),
  grayTranslucent: toRadixVar('grayA', 2),

  brandText: toRadixVar('lime', 11),
  brandTextContrast: toRadixVar('lime', 11),
  brandBg: toRadixVar('lime', 9),
  brandBgSubtle: toRadixVar('lime', 8),
  brandBgHover: toRadixVar('lime', 9),
  brandBgActive: toRadixVar('lime', 10),

  borderLightest: toRadixVar('gray', 1),
  borderLight: toRadixVar('whiteA', 11),
  borderDark: toRadixVar('blackA', 9),
  borderDarkest: toRadixVar('blackA', 12),
};
const lightVars = {
  boxRetro:
    'inset 1px 1px 0px 1px var(--borderLight), inset 0 0 0 1px var(--borderDark), 1px 1px 0 0px var(--borderDarkest)',
  boxRetroFocus:
    'inset 1px 1px 0px 1px var(--borderLight), inset -0.5px -0.5px 0px 1px var(--borderDark), 0.5px 0.5px 0 1px var(--borderDarkest)',
  boxRetroActive:
    'inset 0 0 0 1px var(--borderDark), 0 0 0 0px var(--borderDarkest)',
  color: 'rgb(195 199 203)',
  boxRetroInner:
    'inset 0px 0px 0px 0px, inset 1px 1px 0px 0px var(--borderDark), 0.5px 0.5px 0px 0.5px var(--borderLight)',
  boxRetroProgress:
    'var(--gray8) -1px -1px 0px 0px inset, var(--borderDarkest) 1px 1px 0px 0px inset, var(--borderLightest) 0.5px 0.5px 0px 0.5px',
};

// const lightColorVariables = createAliasColorVariables({
//   ...aliasLightVars,
// });

const aliasTheme = createAliasTheme(aliasLightColors);

/** @type {import('tailwindcss').Config['theme']} */
const theme = {
  extend: {
    padding: {
      retro: '7px 16px 5px',
      retroActive: '8px 16px 4px',
    },
    boxShadow: {
      retro: 'var(--boxRetro)',
      retroFocus: 'var(--boxRetroFocus)',
      retroActive: 'var(--boxRetroActive)',
      retroInner: 'var(--boxRetroInner)',
      retroProgress: 'var(--boxRetroProgress)',
    },
    colors: {
      ...aliasTheme,
      brand: toRadixVars('lime'),
      // appBg: toRadixVar('gray', 9),
      // appBgSubtle: toRadixVar('gray', 10),
      // panel: toRadixVar('gray', 3),
      // panelHover: toRadixVar('gray', 4),
    },
    spacing: {
      'nav-height': '72px',
      'bottom-tabs-height': '56px',
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
    DEFAULT: {
      ...aliasLightColors,
      ...lightVars,
    },
  },
  // darkVariables: {
  //   ...darkColorVariables,
  // },
};

module.exports = {
  theme,
};
