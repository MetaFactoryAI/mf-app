import '../../../../apps/expo/shim';
import WalletConnectProvider from '@walletconnect/react-native-dapp';
import { WagmiConfig } from 'wagmi';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wagmiClient } from 'app/provider/web3/rainbowKit';

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <WalletConnectProvider
      redirectUrl={Platform.OS === 'web' ? window.location.origin : 'mdwtf://'}
      storageOptions={{
        // @ts-expect-error: Internal
        asyncStorage: AsyncStorage,
      }}
    >
      <WagmiConfig client={wagmiClient}>{children}</WagmiConfig>
    </WalletConnectProvider>
  );
};
