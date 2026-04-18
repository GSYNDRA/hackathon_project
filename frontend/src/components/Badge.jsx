import React from 'react';
import clsx from 'clsx';

const TONES = {
  blue: 'bg-sui-400/15 text-sui-300 border-sui-400/30',
  teal: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
  amber: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  violet: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
  green: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  gray: 'bg-white/5 text-ink-100 border-white/10',
  red: 'bg-red-400/15 text-red-300 border-red-400/30',
};

export default function Badge({ tone = 'blue', children, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded-full border',
        TONES[tone] || TONES.gray,
        className
      )}
    >
      {children}
    </span>
  );
}
