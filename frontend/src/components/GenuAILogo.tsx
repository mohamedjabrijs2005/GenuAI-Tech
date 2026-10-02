'use client';

import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GenuAILogo({ size = 'md' }: Props) {
  const sizeMap = {
    sm: { box: 32, icon: 16, text: 14, sub: 9 },
    md: { box: 40, icon: 20, text: 16, sub: 10 },
    lg: { box: 48, icon: 24, text: 18, sub: 11 },
    xl: { box: 60, icon: 30, text: 22, sub: 12 },
  };

  const s = sizeMap[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-2xl flex items-center justify-center text-white shadow-lg relative overflow-hidden"
        style={{
          width: s.box,
          height: s.box,
          background: 'linear-gradient(135deg, #00236f 0%, #1e3a8a 50%, #3b82f6 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 8px 20px rgba(0, 35, 111, 0.35)',
        }}
      >
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="#90a8ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <div
          className="font-black tracking-tight leading-none"
          style={{
            fontSize: s.text,
            background: 'linear-gradient(135deg, #00236f 0%, #1e3a8a 70%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          GenuAI
        </div>
        <div
          className="font-bold uppercase tracking-widest text-slate-400 mt-0.5"
          style={{ fontSize: s.sub, letterSpacing: '0.15em' }}
        >
          Technologies
        </div>
      </div>
    </div>
  );
}
