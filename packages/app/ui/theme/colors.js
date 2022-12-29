/* eslint-disable @typescript-eslint/no-var-requires */
const radixColors = require('@radix-ui/colors');

const renameColors = (colors, oldName, newName) => {
  /** @type {{ [s: string]: { [s: string]: string; }; }} */
  const colorObject = {};

  for (const [colorName, colorValue] of Object.entries(colors)) {
    const newColorName = colorName.replace(oldName, newName);
    colorObject[newColorName] = colorValue;
  }

  return colorObject;
};

const customColors = {
  teal: {
    teal1: 'hsl(175, 60.0%, 98.7%)',
    teal2: 'hsl(175, 73.3%, 97.1%)',
    teal3: 'hsl(176, 70.2%, 94.4%)',
    teal4: 'hsl(176, 63.8%, 90.6%)',
    teal5: 'hsl(177, 58.3%, 85.4%)',
    teal6: 'hsl(178, 54.6%, 78.4%)',
    teal7: 'hsl(179, 53.7%, 68.7%)',
    teal8: 'hsl(179, 60.3%, 52.5%)',
    teal9: 'hsl(180, 95.0%, 39.0%)',
    teal10: 'hsl(181, 91.2%, 36.8%)',
    teal11: 'hsl(182, 85.0%, 31.0%)',
    teal12: 'hsl(182, 88.0%, 12.5%)',
  },
  tealA: {
    tealA1: 'hsla(185, 95.2%, 41.2%, 0.020)',
    tealA2: 'hsla(175, 99.9%, 42.3%, 0.051)',
    tealA3: 'hsla(176, 97.8%, 42.2%, 0.095)',
    tealA4: 'hsla(176, 99.9%, 38.5%, 0.153)',
    tealA5: 'hsla(177, 99.3%, 36.6%, 0.232)',
    tealA6: 'hsla(178, 99.4%, 35.4%, 0.334)',
    tealA7: 'hsla(179, 99.6%, 35.0%, 0.483)',
    tealA8: 'hsla(179, 99.9%, 37.6%, 0.761)',
    tealA9: 'hsla(180, 100%, 37.8%, 0.980)',
    tealA10: 'hsla(181, 99.9%, 34.6%, 0.969)',
    tealA11: 'hsla(182, 100%, 27.6%, 0.953)',
    tealA12: 'hsla(182, 100%, 11.0%, 0.980)',
  },
  tealDark: {
    teal1: 'hsl(182, 60.0%, 7.2%)',
    teal2: 'hsl(182, 71.4%, 8.2%)',
    teal3: 'hsl(182, 75.9%, 10.8%)',
    teal4: 'hsl(182, 79.3%, 12.8%)',
    teal5: 'hsl(182, 82.5%, 14.6%)',
    teal6: 'hsl(182, 86.6%, 16.9%)',
    teal7: 'hsl(182, 92.6%, 20.1%)',
    teal8: 'hsl(182, 100%, 24.5%)',
    teal9: 'hsl(180, 95.0%, 39.0%)',
    teal10: 'hsl(178, 100%, 40.0%)',
    teal11: 'hsl(176, 100%, 42.2%)',
    teal12: 'hsl(175, 73.0%, 93.2%)',
  },
  tealDarkA: {
    tealA1: 'hsla(0, 0%, 0%, 0)',
    tealA2: 'hsla(186, 100%, 50.0%, 0.031)',
    tealA3: 'hsla(182, 98.0%, 50.9%, 0.085)',
    tealA4: 'hsla(184, 99.6%, 51.3%, 0.133)',
    tealA5: 'hsla(182, 99.5%, 51.3%, 0.173)',
    tealA6: 'hsla(183, 99.7%, 50.4%, 0.226)',
    tealA7: 'hsla(182, 100%, 50.0%, 0.310)',
    tealA8: 'hsla(183, 100%, 50.0%, 0.425)',
    tealA9: 'hsla(180, 99.8%, 50.8%, 0.731)',
    tealA10: 'hsla(178, 100%, 50.0%, 0.775)',
    tealA11: 'hsla(176, 100%, 49.9%, 0.824)',
    tealA12: 'hsla(175, 99.8%, 95.1%, 0.978)',
  },

  lime: {
    lime1: 'hsl(75, 50.0%, 98.7%)',
    lime2: 'hsl(75, 66.7%, 96.5%)',
    lime3: 'hsl(75, 76.0%, 92.3%)',
    lime4: 'hsl(74, 75.3%, 87.5%)',
    lime5: 'hsl(74, 71.5%, 81.9%)',
    lime6: 'hsl(72, 65.0%, 74.6%)',
    lime7: 'hsl(69, 53.2%, 61.8%)',
    lime8: 'hsl(66, 61.7%, 45.1%)',
    lime9: 'hsl(71, 67.0%, 50.0%)',
    lime10: 'hsl(70, 68.3%, 46.9%)',
    lime11: 'hsl(65, 80.0%, 26.0%)',
    lime12: 'hsl(68, 70.0%, 11.5%)',
  },
  limeA: {
    limeA1: 'hsla(70, 93.8%, 31.4%, 0.020)',
    limeA2: 'hsla(75, 99.3%, 40.2%, 0.059)',
    limeA3: 'hsla(74, 98.7%, 43.2%, 0.138)',
    limeA4: 'hsla(74, 99.6%, 43.0%, 0.220)',
    limeA5: 'hsla(75, 99.8%, 41.8%, 0.310)',
    limeA6: 'hsla(72, 99.8%, 39.3%, 0.420)',
    limeA7: 'hsla(69, 99.7%, 34.6%, 0.585)',
    limeA8: 'hsla(66, 99.8%, 33.7%, 0.828)',
    limeA9: 'hsla(71, 99.8%, 40.2%, 0.836)',
    limeA10: 'hsla(70, 100%, 37.6%, 0.851)',
    limeA11: 'hsla(65, 99.5%, 22.0%, 0.950)',
    limeA12: 'hsla(68, 99.6%, 8.4%, 0.965)',
  },
  limeDark: {
    lime1: 'hsl(65, 55.0%, 6.0%)',
    lime2: 'hsl(64, 56.8%, 7.3%)',
    lime3: 'hsl(68, 50.2%, 9.9%)',
    lime4: 'hsl(69, 50.3%, 12.1%)',
    lime5: 'hsl(69, 52.6%, 14.2%)',
    lime6: 'hsl(68, 55.7%, 16.7%)',
    lime7: 'hsl(67, 59.7%, 20.1%)',
    lime8: 'hsl(65, 64.8%, 24.5%)',
    lime9: 'hsl(71, 67.0%, 50.0%)',
    lime10: 'hsl(65, 85.0%, 60.0%)',
    lime11: 'hsl(71, 70.0%, 43.8%)',
    lime12: 'hsl(74, 79.0%, 92.6%)',
  },
  limeDarkA: {
    limeA1: 'hsla(0, 0%, 0%, 0)',
    limeA2: 'hsla(65, 96.4%, 59.6%, 0.022)',
    limeA3: 'hsla(78, 98.0%, 70.4%, 0.061)',
    limeA4: 'hsla(71, 97.8%, 67.4%, 0.096)',
    limeA5: 'hsla(72, 98.4%, 65.6%, 0.135)',
    limeA6: 'hsla(69, 99.7%, 64.3%, 0.182)',
    limeA7: 'hsla(67, 99.1%, 62.1%, 0.252)',
    limeA8: 'hsla(65, 100%, 60.0%, 0.342)',
    limeA9: 'hsla(71, 99.8%, 59.7%, 0.819)',
    limeA10: 'hsla(65, 99.8%, 63.7%, 0.936)',
    limeA11: 'hsla(71, 99.9%, 58.7%, 0.719)',
    limeA12: 'hsla(73, 100%, 94.2%, 0.980)',
  },
  blackA: {
    ...radixColors.blackA,
    blackA11: 'hsla(0, 0%, 0%, 0.7)',
  },
  whiteA: {
    ...radixColors.whiteA,
    whiteA11: 'hsla(0, 0%, 100%, 0.7)',
  },
};

const lightColors = {
  teal: customColors.teal,
  tealA: customColors.tealA,

  lime: customColors.lime,
  limeA: customColors.limeA,

  blackA: customColors.blackA,
  whiteA: customColors.whiteA,

  gray: renameColors(radixColors.sand, 'sand', 'gray'),
  grayA: renameColors(radixColors.sandA, 'sand', 'gray'),

  red: renameColors(radixColors.crimson, 'crimson', 'red'),
  redA: renameColors(radixColors.crimsonA, 'crimson', 'red'),

  green: renameColors(radixColors.grass, 'grass', 'green'),
  greenA: renameColors(radixColors.grassA, 'grass', 'green'),

  yellow: radixColors.yellow,
  yellowA: radixColors.yellowA,

  blue: radixColors.blue,
  blueA: radixColors.blueA,
};

const darkColors = {
  tealDark: customColors.tealDark,
  tealDarkA: customColors.tealDarkA,

  limeDark: customColors.limeDark,
  limeDarkA: customColors.limeDarkA,

  blackA: customColors.blackA,
  whiteA: customColors.whiteA,

  grayDark: renameColors(radixColors.sandDark, 'sand', 'gray'),
  grayDarkA: renameColors(radixColors.sandDarkA, 'sand', 'gray'),

  redDark: renameColors(radixColors.crimsonDark, 'crimson', 'red'),
  redDarkA: renameColors(radixColors.crimsonDarkA, 'crimson', 'red'),

  greenDark: renameColors(radixColors.grassDark, 'grass', 'green'),
  greenDarkA: renameColors(radixColors.grassDarkA, 'grass', 'green'),

  yellowDark: radixColors.yellowDark,
  yellowDarkA: radixColors.yellowDarkA,

  blueDark: radixColors.blueDark,
  blueDarkA: radixColors.blueDarkA,
};

module.exports = {
  lightColors,
  darkColors,
};
