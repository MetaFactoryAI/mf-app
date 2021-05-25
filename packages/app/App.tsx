import './shim';
import 'react-native-gesture-handler';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useWalletConnect,
  withWalletConnect,
} from '@walletconnect/react-native-dapp';
import { StatusBar } from 'expo-status-bar';

import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Text, Button, View, Platform } from 'react-native';

import { linking } from './navigation/linking';
import { RootNavigator } from './navigation/RootNavigator';


const WalletConnectUI: React.FC = () => {
  const connector = useWalletConnect();
  if (!connector.connected) {
    // Connect wallet before continuing
    return (
      <Button
        title="Connect"
        onPress={() => {
          connector.connect();
        }}
      />
    );
  }

  // User is connected
  return (
    <View style={styles.container}>
      <Button
        title="Kill session"
        onPress={() => {
          connector.killSession();
        }}
      />
      <StatusBar style="auto" />
    </View>
  );
};

const App: React.FC = () => (
  <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
    <RootNavigator />
  </NavigationContainer>
);

// eslint-disable-next-line import/no-default-export
export default withWalletConnect(App, {
  redirectUrl: Platform.OS === 'web' ? window.location.origin : 'appScheme://',
  storageOptions: {
    asyncStorage: AsyncStorage,
  },
});
