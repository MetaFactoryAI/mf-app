import './shim';
import 'react-native-gesture-handler';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { withWalletConnect } from '@walletconnect/react-native-dapp';
import React from 'react';
import { Text } from 'react-native';

import { linking } from './navigation/linking';
import { RootNavigator } from './navigation/RootNavigator';

const App: React.FC = () => (
  <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
    <RootNavigator />
  </NavigationContainer>
);

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
