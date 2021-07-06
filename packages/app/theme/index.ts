import {
  createTheme,
  defaultDarkTheme,
  defaultLightTheme,
} from '@mf/components/theme';
import { Theme as NavTheme } from '@react-navigation/native';

export const LightTheme = createTheme({
  ...defaultLightTheme,
});

export const DarkTheme = createTheme({
  ...defaultDarkTheme,
});

export const LightNavTheme: NavTheme = {
  dark: false,
  colors: {
    primary: LightTheme.colors.accent,
    background: LightTheme.colors.shapeBg,
    card: LightTheme.colors.shapeBg,
    text: LightTheme.colors.primaryContent,
    border: LightTheme.colors.border,
    notification: LightTheme.colors.error,
  },
};

export const DarkNavTheme: NavTheme = {
  dark: true,
  colors: {
    primary: DarkTheme.colors.accent,
    background: DarkTheme.colors.bg,
    card: DarkTheme.colors.shapeBg,
    text: DarkTheme.colors.primaryContent,
    border: DarkTheme.colors.border,
    notification: DarkTheme.colors.error,
  },
};
