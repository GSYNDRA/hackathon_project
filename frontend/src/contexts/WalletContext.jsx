import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCurrentAccount, useCurrentWallet, useDisconnectWallet } from '@mysten/dapp-kit';

const WalletCtx = createContext({ address: null, connected: false, disconnect: () => {} });

export function WalletContextProvider({ children }) {
  const account = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  // Keep localStorage.wallet_address in sync with the connected account,
  // so the axios interceptor can always attach the x-wallet-address header.
  useEffect(() => {
    if (account?.address) {
      localStorage.setItem('wallet_address', account.address);
    } else {
      localStorage.removeItem('wallet_address');
    }
  }, [account?.address]);

  const value = useMemo(
    () => ({
      address: account?.address || null,
      connected: !!currentWallet,
      walletName: currentWallet?.name || null,
      disconnect: () => disconnect(),
    }),
    [account, currentWallet, disconnect]
  );

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export const useWallet = () => useContext(WalletCtx);
