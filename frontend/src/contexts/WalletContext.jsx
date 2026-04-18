import React, { createContext, useContext } from 'react';
import { useCurrentAccount, useWallets } from '@mysten/dapp-kit';

const WalletContext = createContext(null);

export const AppWalletProvider = ({ children }) => {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();

  const value = {
    account: currentAccount,
    address: currentAccount?.address,
    isConnected: !!currentAccount,
    wallets,
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
