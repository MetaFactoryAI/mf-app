import { createClient } from 'wagmi';
import { provider, webSocketProvider } from 'app/provider/web3/chains';
import { connectors } from 'app/provider/web3/rainbowKit';

export const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});
