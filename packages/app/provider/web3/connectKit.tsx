import { ConnectKitProvider, getDefaultClient } from 'connectkit';
import { WagmiConfig, createClient } from 'wagmi';

import { chains, provider } from 'app/provider/web3/chains';

import { siwe } from 'shared/auth/siwe';
import { ALCHEMY_ID } from 'shared/config/public';

const client = createClient(
  getDefaultClient({
    appName: 'MetaFactory',
    alchemyId: ALCHEMY_ID,
    chains: chains,
    provider: provider,
  }),
);

type Props = {
  children: React.ReactNode;
};

export const Web3Provider: React.FC<Props> = ({ children }) => {
  return (
    <WagmiConfig client={client}>
      <siwe.Provider>
        <ConnectKitProvider
          // theme="minimal"
          customTheme={{
            '--ck-connectbutton-color': 'var(--grayText)',
            '--ck-connectbutton-background': 'var(--grayBg)',
            '--ck-connectbutton-hover-background': 'var(--grayBgHover)',
            '--ck-connectbutton-active-background': 'var(--grayBg)',
            '--ck-connectbutton-box-shadow': 'var(--boxRetro)',
            '--ck-connectbutton-hover-box-shadow': 'var(--boxRetroHover)',
            '--ck-connectbutton-active-box-shadow': 'var(--boxRetroActive)',

            '--ck-connectbutton-border-radius': '0',

            '--ck-primary-button-color': 'var(--grayText)',
            '--ck-primary-button-background': 'var(--grayBg)',
            '--ck-primary-button-hover-background': 'var(--grayBgHover)',
            '--ck-primary-button-active-background': 'var(--grayBg)',
            '--ck-primary-button-box-shadow': 'var(--boxRetro)',
            '--ck-primary-button-hover-box-shadow': 'var(--boxRetroHover)',
            '--ck-primary-button-active-box-shadow': 'var(--boxRetroActive)',

            '--ck-primary-button-active-border-radius': '0',
            '--ck-primary-button-border-radius': '0',

            '--ck-secondary-button-color': 'var(--grayText)',
            '--ck-secondary-button-background': 'var(--grayBg)',
            '--ck-secondary-button-hover-background': 'var(--grayBgHover)',
            '--ck-secondary-button-active-background': 'var(--grayBg)',
            '--ck-secondary-button-border-radius': '0',

            '--ck-tertiary-button-color': 'var(--grayText)',
            '--ck-tertiary-button-background': 'var(--grayBg)',
            '--ck-tertiary-button-hover-background': 'var(--grayBgHover)',
            '--ck-tertiary-button-active-background': 'var(--grayBgActive)',
            '--ck-tertiary-button-border-radius': '0',

            '--ck-overlay-backdrop-filter': 'blur(4px)',
            '--ck-overlay-background': 'var(--overlay)',

            '--ck-border-radius': '0',
            '--ck-modal-box-shadow': 'var(--boxRetro)',
            '--ck-body-color': 'var(--grayText)',
            '--ck-body-divider': 'var(--grayDivider)',
            '--ck-body-color-muted': 'var(--grayText)',
            '--ck-body-color-danger': 'var(--red9)',
            '--ck-body-color-valid': 'var(--green9)',
            '--ck-body-action-color': 'var(--grayText)',
            '--ck-body-color-muted-hover': 'var(--grayText)',
            '--ck-body-background': 'var(--appBg)',
            '--ck-body-background-secondary': 'var(--appBgSubtle)',
            '--ck-body-background-tertiary': 'var(--appBgSubtle)',
            '--ck-body-background-transparent': 'var(--grayTranslucent)',
            '--ck-body-background-secondary-hover-outline':
              'var(--grayTranslucent)',

            '--ck-tooltip-color': 'var(--grayText)',
            '--ck-tooltip-background': 'var(--grayBg)',
            '--ck-tooltip-background-secondary': 'var(--grayBgSubtle)',
            '--ck-dropdown-active-background': 'var(--grayBgActive)',
            '--ck-spinner-color': 'var(--brandBg)',
            '--ck-focus-color': 'var(--brandBg)',
            '--ck-qr-dot-color': 'var(--grayText)',
          }}
        >
          {children}
        </ConnectKitProvider>
      </siwe.Provider>
    </WagmiConfig>
  );
};
