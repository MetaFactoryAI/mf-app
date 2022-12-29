// @ts-check
const { theme } = require('app/ui/theme');
const nativewind = require('nativewind/tailwind');
const { lightColors, darkColors } = require('app/ui/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: 'class',
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    '../../packages/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    ...theme,
  },
  presets: [nativewind],
  plugins: [
    require('windy-radix-palette')({
      colors: {
        ...lightColors,
        ...darkColors,
      },
    }),
  ],
  important: 'html',
};
