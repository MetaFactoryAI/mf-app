import {
  Box,
  Button,
  ScreenContainer,
  ScrollContainer,
  Spacer,
  StyledText,
} from '@mf/ui';
import { useWalletConnect } from '@walletconnect/react-native-dapp';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { ProductProposalCard } from '../components/ProductProposalCard';
import { MainStackScreenProps, Screen } from '../navigation/types';

type Props = MainStackScreenProps<Screen.HOME>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const connector = useWalletConnect();

  const account = connector?.accounts?.[0];
  return (
    <ScreenContainer>
      <ScrollContainer px="m">
        <Button
          mt="m"
          alignSelf="flex-end"
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
        {account ? (
          <>
            <StyledText mt="m" variant="header">
              Connected to
            </StyledText>
            <StyledText variant="body" color="alert">
              {account}
            </StyledText>
          </>
        ) : null}
        <Box row my="l" justifyContent="space-between">
          <StyledText variant="header">Proposals</StyledText>
          <Button title="Create" />
        </Box>
        <Spacer />
        <ProductProposalCard
          onPress={() => {
            navigation.navigate(Screen.PROPOSAL, { proposalId: '1' });
          }}
          title="Unisocks V2"
          author="METADREAMER"
          brand="Uniswap"
          tags={['Socks', 'All-over Print', 'Embroidered']}
        />
        <StatusBar style="auto" />
      </ScrollContainer>
    </ScreenContainer>
  );
};

// eslint-disable-next-line import/no-default-export
export default HomeScreen;
