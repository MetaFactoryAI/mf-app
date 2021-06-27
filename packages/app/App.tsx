import './shim';

import { BaseComponent } from '@mf/components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useWalletConnect,
  withWalletConnect,
} from '@walletconnect/react-native-dapp';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Button,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const App: React.FC = () => {
  const connector = useWalletConnect();
  if (!connector.connected) {
    // Connect wallet before continuing
    return (
      <SafeAreaView>
        <Button
          title="Connect"
          onPress={() => {
            connector.connect();
          }}
        />
      </SafeAreaView>
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
  },
});

const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-color-literals
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
});
