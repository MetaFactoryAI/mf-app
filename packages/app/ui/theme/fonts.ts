import { Platform } from 'react-native';

export const fontName = 'Inter';
export const fontNames = {
  light: 'InterLight',
  normal: 'Inter',
  bold: 'InterBold',
} as const;

export const webFont = (font: string) =>
  Platform.select({
    web: `${font}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, Inter-serif`,
    default: font,
  });
