'use client';

import React from 'react';

interface BadgeCardProps {
  title: string;
  icon?: React.ReactNode;
  variant?: 'amber' | 'sky' | 'pink' | 'white' | 'green' | 'red';
  rotate?: '-3' | '3' | 'none';
  children: React.ReactNode;
  className?: string;
}

const variantBgMap = {
  amber: 'bg-[#FFB800]',
  sky: 'bg-[#A9D9F2]',
  pink: 'bg-[#FF6FA8]',
  white: 'bg-white',
  green: 'bg-[#3DDC84]',
  red: 'bg-[#FF4D4D]',
};

const rotateMap = {
  '-3': '-rotate-3',
  '3': 'rotate-3',
  none: '',
};

export const BadgeCard: React.FC<BadgeCardProps> = ({
  title,
  icon,
  variant = 'white',
  rotate = 'none',
  children,
  className = '',
}) => {
  return (
    <div
      className={`border-3 border-[#0A0A0A] shadow-neo overflow-hidden rounded-none transition-transform duration-150 ${
        variantBgMap[variant]
      } ${rotateMap[rotate]} ${className}`}
    >
      {/* Black Header Strip */}
      <div className="bg-[#0A0A0A] text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between border-b-3 border-[#0A0A0A]">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#FFB800]">{icon}</span>}
          <span>★ {title}</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>

      {/* Card Content Body */}
      <div className="p-5">{children}</div>
    </div>
  );
};
