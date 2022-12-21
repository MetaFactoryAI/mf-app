import { ThemeProvider } from '@mf/ui/theme';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LightTheme } from '../theme';

export const mockSafeAreaInsets = { top: 0, left: 0, right: 0, bottom: 34 };

export const MockProvider: React.FC = ({ children }) => (
  <SafeAreaProvider initialSafeAreaInsets={mockSafeAreaInsets}>
    <ThemeProvider theme={LightTheme}>{children}</ThemeProvider>
  </SafeAreaProvider>
);
