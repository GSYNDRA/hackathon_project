import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, Trophy, ShieldCheck } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { useRole } from '../contexts/RoleContext';
import { useWallet } from '../contexts/WalletContext';

export default function RoleSelector() {
  const { address } = useWallet();
  const { registerRole, isLoading, error } = useRole();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(null);

  const handlePick = async (role) => {
    setPicking(role);
    localStorage.setItem('wallet_address', address);
    const ok = await registerRole(role);
    setPicking(null);
    if (ok) {
      localStorage.setItem('user_role', role);
      navigate(role === 'teacher' ? '/teacher' : '/student');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">Choose your role</h2>
        <p className="text-ink-200">
          Your role is recorded on chain and cannot be changed for this wallet — pick carefully.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card hoverable className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sui-400/15 grid place-items-center text-sui-300">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Teacher</h3>
              <p className="text-xs text-ink-200">Create courses · Write exams · Distribute rewards</p>
            </div>
          </div>
          <ul className="text-sm text-ink-100 space-y-1.5 mt-1">
            <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 text-sui-300 mt-0.5 shrink-0" /> Answers hashed on chain before exam</li>
            <li className="flex items-start gap-2"><Trophy className="h-4 w-4 text-sui-300 mt-0.5 shrink-0" /> Keep whatever's not distributed to winners</li>
          </ul>
          <Button onClick={() => handlePick('teacher')} loading={isLoading && picking === 'teacher'}>
            Register as Teacher
          </Button>
        </Card>

        <Card hoverable className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sui-400/15 grid place-items-center text-sui-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Student</h3>
              <p className="text-xs text-ink-200">Enroll · Take synchronized exams · Win rewards</p>
            </div>
          </div>
          <ul className="text-sm text-ink-100 space-y-1.5 mt-1">
            <li className="flex items-start gap-2"><Trophy className="h-4 w-4 text-sui-300 mt-0.5 shrink-0" /> Top 20% share tuition pool</li>
            <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 text-sui-300 mt-0.5 shrink-0" /> Escrow held on chain — no teacher can cheat</li>
          </ul>
          <Button variant="secondary" onClick={() => handlePick('student')} loading={isLoading && picking === 'student'}>
            Register as Student
          </Button>
        </Card>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl border border-red-400/30 bg-red-400/10 text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
