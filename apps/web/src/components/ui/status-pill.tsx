'use client';

import React from 'react';

interface StatusPillProps {
  label: string;
  status?: 'online' | 'degraded' | 'warning' | 'alert' | 'neutral';
  pulse?: boolean;
}

const statusColorMap = {
  online: { dot: 'bg-[#3DDC84]', bg: 'bg-[#3DDC84]/20', border: 'border-[#0A0A0A]' },
  degraded: { dot: 'bg-[#FFB800]', bg: 'bg-[#FFB800]/20', border: 'border-[#0A0A0A]' },
  warning: { dot: 'bg-[#FFB800]', bg: 'bg-[#FFB800]/20', border: 'border-[#0A0A0A]' },
  alert: { dot: 'bg-[#FF4D4D]', bg: 'bg-[#FF4D4D]/20', border: 'border-[#0A0A0A]' },
  neutral: { dot: 'bg-gray-400', bg: 'bg-gray-100', border: 'border-[#0A0A0A]' },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  status = 'online',
  pulse = true,
}) => {
  const style = statusColorMap[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 border-3 ${style.border} ${style.bg} font-mono text-xs font-black uppercase tracking-wider shadow-neo-sm`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${style.dot} ${
          pulse ? 'animate-ping opacity-75' : ''
        }`}
      />
      <span>{label}</span>
    </div>
  );
};
