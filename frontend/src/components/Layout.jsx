import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@mysten/dapp-kit';
import { GraduationCap, LogOut, User, BookOpenCheck } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useRole } from '../contexts/RoleContext';

function ShortAddr({ address }) {
  if (!address) return null;
  return (
    <span className="font-mono text-xs text-ink-200">
      {address.slice(0, 6)}…{address.slice(-4)}
    </span>
  );
}

export default function Layout({ children }) {
  const { address, connected, disconnect } = useWallet();
  const { role, clearRole } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    disconnect();
    clearRole();
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('user_role');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-white/5 backdrop-blur-xl bg-ink-900/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sui-300 to-sui-500 grid place-items-center shadow-[0_0_20px_-5px_rgba(77,162,255,0.7)]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide">Sui Teaching</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-200">Learn · Compete · Earn</span>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {connected && role === 'teacher' && (
              <Link
                to="/teacher"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/teacher'
                    ? 'text-sui-300 bg-sui-400/10'
                    : 'text-ink-100 hover:text-sui-300'
                }`}
              >
                <BookOpenCheck className="inline h-4 w-4 mr-1 -mt-0.5" /> Teacher
              </Link>
            )}
            {connected && role === 'student' && (
              <Link
                to="/student"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/student'
                    ? 'text-sui-300 bg-sui-400/10'
                    : 'text-ink-100 hover:text-sui-300'
                }`}
              >
                <User className="inline h-4 w-4 mr-1 -mt-0.5" /> Student
              </Link>
            )}

            {!connected ? (
              <ConnectButton
                className="!bg-gradient-to-r !from-sui-400 !to-sui-500 !text-white !font-medium !rounded-xl !px-4 !py-2 !text-sm"
                connectText="Connect Wallet"
              />
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-2">
                <div className="flex flex-col items-end">
                  {role && (
                    <span className="text-[10px] uppercase tracking-widest text-sui-300">{role}</span>
                  )}
                  <ShortAddr address={address} />
                </div>
                <button
                  onClick={handleDisconnect}
                  title="Disconnect"
                  className="h-9 w-9 grid place-items-center rounded-lg border border-white/10 hover:border-sui-400/50 hover:text-sui-300 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">{children}</main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-ink-200">
        Built on <span className="text-sui-300 font-medium">Sui</span> · Escrow · Synced exams · Ranked rewards
      </footer>
    </div>
  );
}
