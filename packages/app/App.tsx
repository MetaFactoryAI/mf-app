import './shim';
import 'react-native-gesture-handler';

import { ThemeProvider } from '@mf/components/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { withWalletConnect } from '@walletconnect/react-native-dapp';
import React from 'react';
import { Text, useColorScheme } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { linking } from './navigation/linking';
import { RootNavigator } from './navigation/RootNavigator';
import { DarkNavTheme, DarkTheme, LightNavTheme, LightTheme } from './theme';

const App: React.FC = () => {
  const scheme = useColorScheme();

  return (
    <ThemeProvider theme={scheme === 'dark' ? DarkTheme : LightTheme}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <NavigationContainer
          theme={scheme === 'dark' ? DarkNavTheme : LightNavTheme}
          linking={linking}
          fallback={<Text>Loading...</Text>}
        >
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

let redirectEndpoint = 'web';
if (typeof window !== 'undefined') {
  redirectEndpoint = 'appScheme://';
}

// eslint-disable-next-line import/no-default-export
export default withWalletConnect(App, {
  redirectUrl: redirectEndpoint,
  storageOptions: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    asyncStorage: AsyncStorage,
    database: 'mf-app-kv-storage-db',
  },
});
