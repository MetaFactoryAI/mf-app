import {
  getDefaultWallets,
  createAuthenticationAdapter,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { chains } from 'shared/config/chains';
import { GetSiweMessageOptions } from '@rainbow-me/rainbowkit-siwe-next-auth';
import { ReactNode, useMemo } from 'react';
import {
  getCsrfToken,
  SessionProvider,
  signIn,
  signOut,
  useSession,
} from 'next-auth/react';
import { SiweMessage } from 'siwe';
import { WagmiConfig } from 'wagmi';
import { wagmiClient } from 'app/provider/web3/wagmiClient';
import { Session } from 'next-auth';

type UnconfigurableMessageOptions = {
  address: string;
  chainId: number;
  nonce: string;
};

type ConfigurableMessageOptions = Partial<
  Omit<SiweMessage, keyof UnconfigurableMessageOptions>
> & {
  [Key in keyof UnconfigurableMessageOptions]?: never;
};

export const { connectors } = getDefaultWallets({
  appName: 'MetaFactory',
  chains,
});

interface RainbowKitSiweNextAuthProviderProps {
  enabled?: boolean;
  getSiweMessageOptions?: GetSiweMessageOptions;
  children: ReactNode;
}

export function RainbowKitSiweNextAuthProvider({
  children,
  enabled,
  getSiweMessageOptions,
}: RainbowKitSiweNextAuthProviderProps) {
  const { status } = useSession();
  const adapter = useMemo(
    () =>
      createAuthenticationAdapter({
        createMessage: ({ address, chainId, nonce }) => {
          const defaultConfigurableOptions: ConfigurableMessageOptions = {
            domain: window.location.host,
            statement: 'Sign in with Ethereum to the app.',
            uri: window.location.origin,
            version: '1',
          };

          const unconfigurableOptions: UnconfigurableMessageOptions = {
            address,
            chainId,
            nonce,
          };

          return new SiweMessage({
            ...defaultConfigurableOptions,

            // Spread custom SIWE message options provided by the consumer
            ...getSiweMessageOptions?.(),

            // Spread unconfigurable options last so they can't be overridden
            ...unconfigurableOptions,
          });
        },

        getMessageBody: ({ message }) => message.prepareMessage(),

        getNonce: async () => {
          const nonce = await getCsrfToken();
          if (!nonce) throw new Error();
          return nonce;
        },

        signOut: async () => {
          await signOut({ redirect: false });
        },

        verify: async ({ message, signature }) => {
          const response = await signIn('credentials', {
            message: JSON.stringify(message),
            redirect: false,
            signature,
          });

          return response?.ok ?? false;
        },
      }),
    [getSiweMessageOptions],
  );

  return (
    <RainbowKitAuthenticationProvider
      adapter={adapter}
      enabled={enabled}
      status={status}
    >
      {children}
    </RainbowKitAuthenticationProvider>
  );
}

type Web3ProviderProps = {
  session?: Session | null;
  children: React.ReactNode;
};

export const Web3Provider: React.FC<Web3ProviderProps> = ({
  children,
  session,
}) => {
  return (
    <WagmiConfig client={wagmiClient}>
      <SessionProvider session={session} refetchInterval={0}>
        <RainbowKitSiweNextAuthProvider>
          <RainbowKitProvider chains={chains} modalSize="compact">
            {children}
          </RainbowKitProvider>
        </RainbowKitSiweNextAuthProvider>
      </SessionProvider>
    </WagmiConfig>
  );
};
