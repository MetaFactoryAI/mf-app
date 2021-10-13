import './shim';
import 'react-native-gesture-handler';

import { ThemeProvider } from '@mf/ui/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import WalletConnectProvider from '@walletconnect/react-native-dapp';
import * as Linking from 'expo-linking';
import React from 'react';
import { Text, useColorScheme } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { linking } from './navigation/linking';
import { RootNavigator } from './navigation/RootNavigator';
import { DarkNavTheme, DarkTheme, LightNavTheme, LightTheme } from './theme';

const REDIRECT_URL = Linking.createURL('');

const App: React.FC = () => {
  const scheme = useColorScheme();

  return (
    <ThemeProvider theme={scheme === 'dark' ? DarkTheme : LightTheme}>
      <WalletConnectProvider
        redirectUrl={REDIRECT_URL}
        storageOptions={{
          // @ts-expect-error mismatch in type defs
          asyncStorage: AsyncStorage,
          database: 'mf-app-kv-storage-db',
        }}
      >
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <NavigationContainer
            theme={scheme === 'dark' ? DarkNavTheme : LightNavTheme}
            linking={linking}
            fallback={<Text>Loading...</Text>}
          >
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </WalletConnectProvider>
    </ThemeProvider>
  );
};

// eslint-disable-next-line import/no-default-export
export default App;
