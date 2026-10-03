'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass, BookOpen, ClipboardCheck, BadgeCheck, FileCheck,
  ShieldCheck, ArrowRight, User, LogOut, ExternalLink, Sparkles, Clock
} from 'lucide-react';
import { GenuAILogo } from '@/components/GenuAILogo';
import { useAuth } from '@/contexts/AuthContext';

const NAV_STEPS = [
  { step: '1', id: 'target', label: 'Target', href: '/candidate/target', icon: Compass, desc: 'Target Requirements' },
  { step: '2', id: 'learn', label: 'Learn', href: '/candidate/learn', icon: BookOpen, desc: 'Rubrics & Study' },
  { step: '3', id: 'practice', label: 'Practice', href: '/candidate/practice', icon: ClipboardCheck, desc: 'Interactive Sandbox' },
  { step: '4', id: 'prove', label: 'Prove', href: '/candidate/prove', icon: BadgeCheck, desc: 'Official Assessment' },
  { step: '5', id: 'evidence', label: 'Evidence', href: '/candidate/evidence', icon: FileCheck, desc: 'Verified Portfolio' },
];

export function CandidateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const candidateName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Alex Rivera';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg, #f7f9fb)' }}>
      {/* Top Header */}
      <header
        style={{
          height: 64,
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/candidate" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <GenuAILogo size="sm" />
          </Link>
          <span style={{ height: 20, width: 1, background: '#cbd5e1' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.04em',
                padding: '3px 8px',
                borderRadius: 6,
                background: '#fefce8',
                border: '1px solid #fde047',
                color: '#854d0e',
                textTransform: 'uppercase',
              }}
            >
              Candidate Workspace
            </span>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              Traceable Capability Pipeline
            </span>
          </div>
        </div>

        {/* User Identity & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {time && (
            <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              <span>{time}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--gold-grad, linear-gradient(135deg, #b8860b 0%, #d4af37 100%))',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {candidateName.charAt(0)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{candidateName}</span>
              <span style={{ fontSize: 10, color: '#059669', display: 'flex', alignItems: 'center', gap: 2 }}>
                <ShieldCheck size={10} /> Verified Identity
              </span>
            </div>
          </div>

          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: '#64748b',
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
            }}
            className="hover:text-primary"
          >
            <span>Company View</span>
            <ExternalLink size={12} />
          </Link>

          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              padding: 6,
            }}
            className="hover:text-danger"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Stepper Navigation Bar: TARGET -> LEARN -> PRACTICE -> PROVE -> EVIDENCE */}
      <nav
        style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <Link
          href="/candidate"
          style={{
            padding: '12px 14px',
            fontSize: 13,
            fontWeight: pathname === '/candidate' ? 800 : 600,
            color: pathname === '/candidate' ? 'var(--primary, #b8860b)' : '#64748b',
            borderBottom: pathname === '/candidate' ? '2px solid var(--primary, #b8860b)' : '2px solid transparent',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Overview
        </Link>

        {NAV_STEPS.map((s, idx) => {
          const isActive = pathname.startsWith(s.href);
          const Icon = s.icon;
          return (
            <Link
              key={s.id}
              href={s.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? 'var(--primary, #b8860b)' : '#64748b',
                borderBottom: isActive ? '2px solid var(--primary, #b8860b)' : '2px solid transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? 'var(--primary, #b8860b)' : '#e2e8f0',
                  color: isActive ? '#fff' : '#64748b',
                }}
              >
                {s.step}
              </div>
              <Icon size={14} />
              <span>{s.label}</span>
              {idx < NAV_STEPS.length - 1 && (
                <span style={{ color: '#cbd5e1', marginLeft: 4 }}>→</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Page Body */}
      <main style={{ flex: 1, padding: '24px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
