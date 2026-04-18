// src/contexts/RoleContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useWallet } from './WalletContext';
import { registerUser, getUserRole } from '../services/api';

const RoleContext = createContext(null);

export const RoleProvider = ({ children }) => {
  const { address, isConnected } = useWallet();
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user already has a role
  const checkExistingRole = useCallback(async () => {
    if (!address) return null;
    
    try {
      const response = await getUserRole(address);
      if (response.role) {
        setRole(response.role);
        return response.role;
      }
    } catch (err) {
      console.log('No existing role found');
    }
    return null;
  }, [address]);

  // Select and save teacher role
  const selectTeacherRole = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call backend API to store role
      await registerUser(address, 'teacher');
      setRole('teacher');
      return true;
    } catch (err) {
      setError(err.message || 'Failed to save role');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const value = {
    role,
    isLoading,
    error,
    checkExistingRole,
    selectTeacherRole,
    isTeacher: role === 'teacher',
    hasRole: !!role
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};
