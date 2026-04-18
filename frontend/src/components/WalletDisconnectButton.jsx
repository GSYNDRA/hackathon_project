import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useRole } from '../contexts/RoleContext';

const WalletDisconnectButton = () => {
  const { address, isConnected, disconnect } = useWallet();
  const { hasRole, role, clearRole } = useRole();

  if (!isConnected) return null;

  const handleDisconnect = () => {
    clearRole();
    disconnect();
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="wallet-disconnect">
      <span className="wallet-badge">
        {formatAddress(address)}
        {hasRole && <span className="wallet-role">({role})</span>}
      </span>
      <button className="btn btn-disconnect" onClick={handleDisconnect}>
        Disconnect
      </button>
    </div>
  );
};

export default WalletDisconnectButton;