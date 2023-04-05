import { createClient } from '@wagmi/core';
import { provider, webSocketProvider } from 'shared/config/chains';

export const wagmiCoreClient = createClient({
  provider,
  webSocketProvider,
});
