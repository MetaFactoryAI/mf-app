// import { Fonts } from './fonts';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from 'app/lib/queryClient';
import { Web3Provider } from 'app/provider/web3';

import { SafeArea } from './safe-area';

type ProviderProps = {
  children: React.ReactNode;
};

export function Provider({ children }: ProviderProps) {
  return (
    <SafeArea>
      {/*<Web3Provider session={session}>{children}</Web3Provider>*/}
      <QueryClientProvider client={queryClient}>
        <Web3Provider>{children}</Web3Provider>
      </QueryClientProvider>
    </SafeArea>
  );
}
