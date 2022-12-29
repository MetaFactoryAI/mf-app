// import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ConnectKitButton } from 'connectkit';

export const ConnectWalletButton: React.FC<
  React.ComponentProps<typeof ConnectKitButton>
> = (props) => {
  // return <ConnectButton chainStatus="icon" showBalance={false} />;
  return <ConnectKitButton {...props} />;
};
