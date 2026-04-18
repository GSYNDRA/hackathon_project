import React from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { useWallet } from '../contexts/WalletContext';
import { useRole } from '../contexts/RoleContext';
import WalletDisconnectButton from './WalletDisconnectButton';

const RoleSelector = () => {
  const { address, isConnected } = useWallet();
  const { role, isLoading, error, hasRole, selectTeacherRole, selectStudentRole, clearRole } = useRole();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="role-selector">
        <div className="role-card">
          <h1>Sui Teaching Platform</h1>
          <p className="subtitle">A decentralized learning platform where teachers create courses and students compete for rewards.</p>
          <h2>Connect Your Wallet</h2>
          <p className="hint">Choose your wallet to get started</p>
          <div className="connect-wrapper">
            <ConnectButton connectText="Connect Wallet" />
          </div>
        </div>
      </div>
    );
  }

  if (hasRole) {
    return (
      <div className="role-selector">
        <div className="role-card">
          <h2>Role Confirmed</h2>
          <div className="role-confirmed">
            <span className="confirmed-icon">✓</span>
            <p>Your wallet <code>{formatAddress(address)}</code> is registered as <strong>{role}</strong>.</p>
            <p className="hint">This choice is permanent and cannot be changed.</p>
            <div className="role-confirmed-actions">
              <button className="btn btn-primary" onClick={() => window.location.href = `/${role}`}>
                Go to {role === 'teacher' ? 'Teacher' : 'Student'} Dashboard
              </button>
              <WalletDisconnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="role-selector">
      <div className="role-card">
        <h1>Sui Teaching Platform</h1>
        <p className="subtitle">A decentralized learning platform where teachers create courses and students compete for rewards.</p>

        <div className="wallet-info">
          <span className="connected-badge">Connected: {formatAddress(address)}</span>
          <WalletDisconnectButton />
        </div>

        <div className="divider" />

        <h2>Choose Your Role</h2>
        <p className="warning">You cannot change this later. Choose carefully.</p>

        <div className="role-options">
          <button
            className="role-btn role-btn-teacher"
            onClick={selectTeacherRole}
            disabled={isLoading}
          >
            <span className="role-icon">🎓</span>
            <span className="role-label">Teacher</span>
            <span className="role-desc">Create courses, design exams, evaluate students</span>
          </button>

          <button
            className="role-btn role-btn-student"
            onClick={selectStudentRole}
            disabled={isLoading}
          >
            <span className="role-icon">📚</span>
            <span className="role-label">Student</span>
            <span className="role-desc">Enroll in courses, take exams, win rewards</span>
          </button>
        </div>

        {isLoading && <p className="loading-text">Registering on-chain... Please confirm in your wallet.</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
};

export default RoleSelector;