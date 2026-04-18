import React, { createContext, useContext, useCallback } from 'react';
import { useCurrentAccount, useWallets, useDisconnectWallet } from '@mysten/dapp-kit';

const WalletContext = createContext(null);

export const AppWalletProvider = ({ children }) => {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: disconnectWallet } = useDisconnectWallet();

  const disconnect = useCallback(() => {
    disconnectWallet();
    localStorage.removeItem('user_role');
    localStorage.removeItem('wallet_address');
  }, [disconnectWallet]);

  const value = {
    account: currentAccount,
    address: currentAccount?.address,
    isConnected: !!currentAccount,
    wallets,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within AppWalletProvider');
  }
  return context;
};
