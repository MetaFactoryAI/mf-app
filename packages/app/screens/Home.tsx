import { Button, ScreenContainer } from '@mf/components';
import { useWalletConnect } from '@walletconnect/react-native-dapp';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

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
      <Button
        mt="m"
        secondary
        title={connector.connected ? 'Kill session' : 'Connect'}
        onPress={() => {
          if (connector.connected) {
            connector.killSession();
          } else {
            connector.connect();
          }
        }}
      />
      <Button mt="m" title="Disabled Button" disabled />
      <StatusBar style="auto" />
    </ScreenContainer>
  );
};

// eslint-disable-next-line import/no-default-export
export default HomeScreen;
