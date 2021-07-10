import { ScreenContainer, StyledText } from '@mf/components';
import { useWalletConnect } from '@walletconnect/react-native-dapp';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Button } from 'react-native';

import { MainStackScreenProps, Screen } from '../navigation/types';

type Props = MainStackScreenProps<Screen.HOME>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const connector = useWalletConnect();

  return (
    <ScreenContainer p="m">
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
    </ScreenContainer>
  );
};

// eslint-disable-next-line import/no-default-export
export default HomeScreen;
