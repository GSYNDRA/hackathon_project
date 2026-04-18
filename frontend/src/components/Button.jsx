import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-sui-400 to-sui-500 text-white shadow-[0_0_24px_-8px_rgba(77,162,255,0.7)] hover:from-sui-300 hover:to-sui-400',
    secondary:
      'bg-white/5 text-ink-50 border border-white/10 hover:border-sui-400/40 hover:bg-white/10',
    ghost: 'text-ink-100 hover:text-sui-300 hover:bg-white/5',
    danger: 'bg-red-500/80 text-white hover:bg-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
