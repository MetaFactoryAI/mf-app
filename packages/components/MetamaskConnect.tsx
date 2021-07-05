import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { connectWallet, getCurrentWalletConnected } from './util/mfWeb3';
import { ConnectedWallet } from './util/types';

export const MetamaskConnect: React.FC = () => {
  const [walletAddress, setWallet] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function connectMetamask() {
      const wallet: ConnectedWallet = await getCurrentWalletConnected();

      setWallet(wallet.address);
      setStatus(wallet.status);

      addWalletListener();
    }
    connectMetamask();
  }, []);

  if (Platform.OS !== 'web') {
    // Web only component, return early.
    return null;
  }

  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus('👆🏽 Connected.');
        } else {
          setWallet('');
          setStatus('🦊 Connect to Metamask using the top right button.');
        }
      });
    } else {
      setStatus(
        '🦊 - You must install Metamask, a virtual Ethereum wallet, in your browser.',
      );
    }
  }

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div className="MetamaskConnectWrapper" style={containerStyle}>
      <button
        type="button"
        id="connectMetamaskButton"
        onClick={connectWalletPressed}
      >
        {walletAddress.length > 0 ? (
          `Connected: ${String(walletAddress).substring(0, 6)}...${String(
            walletAddress,
          ).substring(38)}`
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>

      <span>{`Wallet Status: ${status}`}</span>
    </div>
  );
};
