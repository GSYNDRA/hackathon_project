import React from 'react';
import clsx from 'clsx';

export default function Card({ children, className, hoverable = false, ...rest }) {
  return (
    <div
      className={clsx('glass rounded-2xl p-5', hoverable && 'glass-hover', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
