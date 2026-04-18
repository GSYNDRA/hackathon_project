import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWallet } from './WalletContext';
import { registerUser, getUserRole, getOnChainRole } from '../services/api';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, PLATFORM_OBJECT_ID, SUI_MODULE } from '../config/constants';

const RoleContext = createContext(null);

export const RoleProvider = ({ children }) => {
  const { address, isConnected } = useWallet();
  const client = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [role, setRole] = useState(() => localStorage.getItem('user_role') || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txDigest, setTxDigest] = useState(null);

  useEffect(() => {
    if (!address) {
      setRole(null);
      localStorage.removeItem('user_role');
      localStorage.removeItem('wallet_address');
    }
  }, [address]);

  const checkExistingRole = useCallback(async () => {
    if (!address) return null;
    try {
      const dbRole = await getUserRole(address);
      if (dbRole?.role) {
        setRole(dbRole.role);
        localStorage.setItem('user_role', dbRole.role);
        localStorage.setItem('wallet_address', address);
        return dbRole.role;
      }
      const chainResult = await getOnChainRole(address);
      if (chainResult?.role) {
        setRole(chainResult.role);
        localStorage.setItem('user_role', chainResult.role);
        localStorage.setItem('wallet_address', address);
        return chainResult.role;
      }
    } catch {
      try {
        const chainResult = await getOnChainRole(address);
        if (chainResult?.role) {
          setRole(chainResult.role);
          localStorage.setItem('user_role', chainResult.role);
          localStorage.setItem('wallet_address', address);
          return chainResult.role;
        }
      } catch {
        // not registered either
      }
    }
    return null;
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      checkExistingRole();
    }
  }, [isConnected, address]);

  const selectRole = useCallback(async (chosenRole) => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    if (PLATFORM_OBJECT_ID === 'SET_AFTER_CALLING_CREATE_PLATFORM' || !PLATFORM_OBJECT_ID) {
      setError('Platform not configured. Please deploy and create platform first.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = new Transaction();
      if (chosenRole === 'teacher') {
        tx.moveCall({
          target: `${PACKAGE_ID}::${SUI_MODULE}::register_as_teacher`,
          arguments: [tx.object(PLATFORM_OBJECT_ID)],
        });
      } else {
        tx.moveCall({
          target: `${PACKAGE_ID}::${SUI_MODULE}::register_as_student`,
          arguments: [tx.object(PLATFORM_OBJECT_ID)],
        });
      }

      const result = await signAndExecuteTransaction({ transaction: tx });
      const digest = result.digest;
      setTxDigest(digest);

      await client.waitForTransaction({ digest });

      await registerUser(address, chosenRole, digest);

      setRole(chosenRole);
      localStorage.setItem('user_role', chosenRole);
      localStorage.setItem('wallet_address', address);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to register role');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, signAndExecuteTransaction, client]);

  const clearRole = useCallback(() => {
    setRole(null);
    setTxDigest(null);
    setError(null);
    localStorage.removeItem('user_role');
    localStorage.removeItem('wallet_address');
  }, []);

  const value = {
    role,
    isLoading,
    error,
    txDigest,
    checkExistingRole,
    selectTeacherRole: () => selectRole('teacher'),
    selectStudentRole: () => selectRole('student'),
    clearRole,
    isTeacher: role === 'teacher',
    isStudent: role === 'student',
    hasRole: !!role,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within RoleProvider');
  return context;
};