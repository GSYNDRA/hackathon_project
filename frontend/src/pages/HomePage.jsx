import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@mysten/dapp-kit';
import { ArrowRight, Clock, Trophy, Lock, Zap } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useRole } from '../contexts/RoleContext';
import Card from '../components/Card';
import RoleSelector from '../components/RoleSelector';

function FeaturePill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-100 border border-white/10 rounded-full px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-sui-300" />
      {children}
    </span>
  );
}

export default function HomePage() {
  const { address, connected } = useWallet();
  const { role } = useRole();
  const navigate = useNavigate();

  // Auto-redirect if wallet + role already set
  useEffect(() => {
    if (connected && role === 'teacher') navigate('/teacher');
    if (connected && role === 'student') navigate('/student');
  }, [connected, role, navigate]);

  if (connected && !role) {
    return <RoleSelector />;
  }

  return (
    <div className="flex flex-col items-center text-center gap-10 pt-10">
      <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-sui-400/10 border border-sui-400/25 text-sui-300">
        <Zap className="h-3.5 w-3.5" /> Live on Sui testnet
      </div>

      <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] max-w-4xl">
        Learn, compete,
        <br />
        <span className="text-gradient">win on chain</span>
      </h1>

      <p className="max-w-2xl text-ink-100 text-lg leading-relaxed">
        Teachers create courses and write exams. Students pay tuition into an on-chain escrow
        and all compete in a synchronized exam. The top 20% share the pool automatically —
        everything is handled by a Sui Move contract.
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        <FeaturePill icon={Lock}>Escrow on chain</FeaturePill>
        <FeaturePill icon={Clock}>Synchronized exams</FeaturePill>
        <FeaturePill icon={Trophy}>Ranked rewards</FeaturePill>
      </div>

      <div className="flex items-center gap-3">
        {!connected ? (
          <ConnectButton
            className="!bg-gradient-to-r !from-sui-400 !to-sui-500 !text-white !font-semibold !rounded-xl !px-6 !py-3 !text-base"
            connectText="Connect Wallet to Begin"
          />
        ) : (
          <div className="text-sm text-ink-100">
            Connected as <span className="font-mono text-sui-300">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 w-full max-w-4xl mt-8">
        <Card>
          <div className="h-9 w-9 rounded-lg bg-sui-400/15 grid place-items-center text-sui-300 mb-3">
            <Trophy className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-semibold mb-1">Winner-takes-most</h3>
          <p className="text-sm text-ink-200">
            Rank 1 gets 100% of a tuition. Rank 2 gets 50%. Teachers keep the rest.
          </p>
        </Card>
        <Card>
          <div className="h-9 w-9 rounded-lg bg-sui-400/15 grid place-items-center text-sui-300 mb-3">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-semibold mb-1">On-chain clock</h3>
          <p className="text-sm text-ink-200">
            Exam deadlines enforced by Sui's Clock — no way to cheat the timer.
          </p>
        </Card>
        <Card>
          <div className="h-9 w-9 rounded-lg bg-sui-400/15 grid place-items-center text-sui-300 mb-3">
            <Lock className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-semibold mb-1">Hash-committed answers</h3>
          <p className="text-sm text-ink-200">
            Teachers can't change the key after seeing submissions. Verifiable with keccak256.
          </p>
        </Card>
      </div>

      <div className="text-xs text-ink-200 inline-flex items-center gap-2">
        Scroll down to pick a role <ArrowRight className="h-3 w-3" />
      </div>
    </div>
  );
}
