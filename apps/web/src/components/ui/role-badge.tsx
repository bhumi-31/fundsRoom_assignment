'use client';

import React from 'react';

interface RoleBadgeProps {
  role: 'ADMIN' | 'OPS' | 'SALES';
}

const roleStyles = {
  ADMIN: { bg: 'bg-[#FFB800]', text: 'text-[#0A0A0A]' },
  OPS: { bg: 'bg-[#A9D9F2]', text: 'text-[#0A0A0A]' },
  SALES: { bg: 'bg-[#FF6FA8]', text: 'text-[#0A0A0A]' },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const style = roleStyles[role] || roleStyles.ADMIN;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 border-3 border-[#0A0A0A] ${style.bg} ${style.text} font-mono font-black text-xs uppercase tracking-widest shadow-neo-sm`}
    >
      <span>ROLE:</span>
      <span className="underline decoration-2">{role}</span>
    </div>
  );
};
