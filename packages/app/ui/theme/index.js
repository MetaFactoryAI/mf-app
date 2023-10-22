/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-check
const { alias } = require('windy-radix-palette');

/** @param {{ [s: string]: any; }} aliases */
const createAliasTheme = (aliases) => {
  /** @type {{ [s: string]: { [s: string]: any; } | string; }} */
  const themeColors = {};

  for (const [colorName, colorObj] of Object.entries(aliases)) {
    if (typeof colorObj === 'string') {
      themeColors[colorName] = `var(--${colorName})`;
    } else if (colorObj) {
      themeColors[colorName] = alias(colorName);
    }
  }

  return themeColors;
};

const aliasLightColors = {
  appBg: alias('gray', 9),
  appBgSubtle: alias('gray', 10),
  panel: alias('gray', 3),
  panelHover: alias('gray', 4),
  shadow: alias('grayA', 3),
  overlay: alias('blackA', 9),
  danger: alias('red', 9),
  success: alias('green', 9),

  grayBg: alias('gray', 9),
  grayBgSubtle: alias('gray', 10),
  grayBgHover: alias('gray', 9),
  grayBgActive: alias('gray', 10),
  grayText: alias('gray', 12),
  grayDivider: alias('gray', 11),
  grayTextSubtle: alias('gray', 11),
  grayTranslucent: alias('grayA', 2),

  brandText: alias('lime', 11),
  brandTextContrast: alias('lime', 11),
  brandBg: alias('lime', 9),
  brandBgSubtle: alias('lime', 8),
  brandBgHover: alias('lime', 9),
  brandBgActive: alias('lime', 10),

  borderLightest: alias('gray', 1),
  borderLight: alias('whiteA', 11),
  borderDark: alias('blackA', 9),
  borderDarkest: alias('blackA', 12),
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
      brand: alias('lime'),
      // appBg: alias('gray', 9),
      // appBgSubtle: alias('gray', 10),
      // panel: alias('gray', 3),
      // panelHover: alias('gray', 4),
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
