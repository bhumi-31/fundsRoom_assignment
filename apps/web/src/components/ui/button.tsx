'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'amber' | 'sky' | 'pink' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantMap = {
  primary: 'bg-[#0A0A0A] text-white hover:bg-black',
  secondary: 'bg-white text-[#0A0A0A] hover:bg-gray-100',
  amber: 'bg-[#FFB800] text-[#0A0A0A]',
  sky: 'bg-[#A9D9F2] text-[#0A0A0A]',
  pink: 'bg-[#FF6FA8] text-[#0A0A0A]',
  danger: 'bg-[#FF4D4D] text-white',
};

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled}
      className={`border-3 border-[#0A0A0A] font-sans font-black uppercase tracking-wider shadow-neo active:shadow-neo-active active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantMap[variant]} ${sizeMap[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
