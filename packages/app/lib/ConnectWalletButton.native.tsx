import { useWalletConnect } from 'app/lib/walletconnect';
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';
import { useEffect } from 'react';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { Button } from 'app/ui/input/Button';
import { Text } from 'app/ui/typography';

export const ConnectWalletButton = () => {
  const connector = useWalletConnect();

  const { connect } = useConnect({
    connector: new WalletConnectConnector({
      options: {
        qrcode: false,
        connector,
      },
    }),
  });
  const { disconnect } = useDisconnect();

  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  useEffect(() => {
    if (connector?.accounts?.length && !address) {
      connect();
    } else {
      disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector]);

  if (address) {
    return (
      <>
        <Button title="Disconnect" onPress={() => connector?.killSession()} />
        <Text>Account address: {address}</Text>
        <Text>
          Balance: {balance?.formatted} {balance?.symbol}
        </Text>
      </>
    );
  }

  return <Button title="Connect" onPress={() => connector?.connect()} />;
};
