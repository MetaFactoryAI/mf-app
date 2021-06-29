import { PageContainer } from '@mf/components';
import { useWalletConnect } from '@walletconnect/react-native-dapp';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Button, StyleSheet, Text } from 'react-native';

import { MainStackScreenProps, Screen } from '../navigation/types';

type Props = MainStackScreenProps<Screen.HOME>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const connector = useWalletConnect();

  return (
    <PageContainer>
      <Text style={styles.text}>Home</Text>
      <Button
        title="Go To Screen"
        onPress={() =>
          navigation.navigate(Screen.PROPOSAL, { proposalId: '1' })
        }
      />
      {connector.connected ? (
        <Button
          title="Kill session"
          onPress={() => {
            connector.killSession();
          }}
        />
      ) : (
        <Button
          title="Connect"
          onPress={() => {
            connector.connect();
          }}
        />
      )}
      <StatusBar style="auto" />
    </PageContainer>
  );
};

// eslint-disable-next-line import/no-default-export
export default HomeScreen;

const styles = StyleSheet.create({
  text: {
    fontSize: 24,
    margin: 10,
  },
});
