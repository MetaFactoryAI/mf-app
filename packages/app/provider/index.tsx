// import { Fonts } from './fonts';
import { SafeArea } from './safe-area';
import { Web3Provider } from 'app/provider/web3';
import { Session } from 'next-auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from 'app/lib/queryClient';

type ProviderProps = {
  session?: Session | null;
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
