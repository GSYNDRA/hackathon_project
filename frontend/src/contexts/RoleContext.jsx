import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID, PLATFORM_OBJECT_ID, SUI_MODULE } from '../config/constants';
import { useWallet } from './WalletContext';
import { getUserRole, registerUser, getOnChainRole } from '../services/api';

const RoleCtx = createContext({
  role: null,
  isLoading: false,
  error: null,
  registerRole: async () => false,
  clearRole: () => {},
});

export function RoleContextProvider({ children }) {
  const { address } = useWallet();
  const client = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch role whenever the wallet address changes
  useEffect(() => {
    const fetchRole = async () => {
      if (!address) {
        setRole(null);
        return;
      }
      try {
        const data = await getUserRole(address);
        setRole(data?.role || null);
      } catch {
        setRole(null);
      }
    };
    fetchRole();
  }, [address]);

  const registerRole = useCallback(
    async (chosenRole) => {
      if (!address) {
        setError('Wallet not connected');
        return false;
      }
      if (!PACKAGE_ID || !PLATFORM_OBJECT_ID) {
        setError('Platform not configured — set VITE_SUI_PACKAGE_ID and VITE_SUI_PLATFORM_OBJECT_ID');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check on-chain role first — if this wallet is already in the other vec_set,
        // the on-chain call would abort. We fail fast with a clear message.
        try {
          const onChain = await getOnChainRole(address);
          if (onChain?.role && onChain.role !== chosenRole) {
            throw new Error(
              `This wallet is already registered on chain as "${onChain.role}". Use a different wallet.`
            );
          }
          if (onChain?.role === chosenRole) {
            // Already registered — just sync the DB and proceed
            await registerUser(address, chosenRole, null);
            setRole(chosenRole);
            return true;
          }
        } catch (e) {
          // Non-fatal: on-chain role check is best-effort
          if (String(e.message || '').includes('already registered')) throw e;
        }

        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::${SUI_MODULE}::register_as_${chosenRole}`,
          arguments: [tx.object(PLATFORM_OBJECT_ID)],
        });

        const result = await signAndExecuteTransaction({
          transaction: tx,
          options: { showEffects: true },
        });

        const txResp = await client.waitForTransaction({
          digest: result.digest,
          options: { showEffects: true },
        });

        if (txResp.effects?.status?.status !== 'success') {
          throw new Error(
            `On-chain registration failed: ${txResp.effects?.status?.error || 'unknown'}`
          );
        }

        await registerUser(address, chosenRole, result.digest);
        setRole(chosenRole);
        return true;
      } catch (err) {
        setError(err.message || 'Failed to register role');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [address, client, signAndExecuteTransaction]
  );

  const clearRole = useCallback(() => {
    setRole(null);
    setError(null);
  }, []);

  return (
    <RoleCtx.Provider value={{ role, isLoading, error, registerRole, clearRole }}>
      {children}
    </RoleCtx.Provider>
  );
}

export const useRole = () => useContext(RoleCtx);
