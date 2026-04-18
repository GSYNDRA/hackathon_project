// src/components/TeacherSetup.jsx
import React, { useEffect } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { useWallet } from '../contexts/WalletContext';
import { useRole } from '../contexts/RoleContext';

const TeacherSetup = () => {
  const { address, isConnected } = useWallet();
  const { role, isLoading, error, hasRole, selectTeacherRole, checkExistingRole } = useRole();

  // Check for existing role when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkExistingRole();
    }
  }, [isConnected, address, checkExistingRole]);

  const handleSelectTeacher = async () => {
    const success = await selectTeacherRole();
    if (success) {
      alert('Teacher role saved successfully!');
    }
  };

  // Format wallet address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="teacher-setup" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Teacher Setup</h1>
      <p>Connect your wallet and select your role as teacher.</p>

      {/* Step 1: Connect Wallet */}
      <div className="setup-step" style={{ margin: '2rem 0', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px' }}>
        <h3>Step 1: Connect Wallet</h3>
        
        {!isConnected ? (
          <div style={{ marginTop: '1rem' }}>
            <ConnectButton connectText="Connect Wallet" />
          </div>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Wallet Connected</span>
            <p style={{ marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {formatAddress(address)}
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Select Role */}
      {isConnected && (
        <div className="setup-step" style={{ margin: '2rem 0', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h3>Step 2: Select Teacher Role</h3>
          
          {!hasRole ? (
            <>
              <p style={{ marginTop: '1rem', color: '#6b7280' }}>
                Click below to register as a teacher. This will store your wallet address and role in our database.
              </p>
              <button 
                onClick={handleSelectTeacher}
                disabled={isLoading}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                {isLoading ? 'Saving...' : 'Register as Teacher'}
              </button>
            </>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Teacher Role Selected</span>
              <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                Your wallet {formatAddress(address)} is registered as a teacher.
              </p>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px' }}>
              Error: {error}
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {isConnected && hasRole && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#d1fae5', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#065f46' }}>🎉 Setup Complete!</h3>
          <p style={{ color: '#065f46', marginTop: '0.5rem' }}>
            You are now registered as a teacher. You can create courses and manage exams.
          </p>
          <button 
            onClick={() => window.location.href = '/teacher'}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            Go to Teacher Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherSetup;
