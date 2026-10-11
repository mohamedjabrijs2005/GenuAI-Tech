'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateSidebar } from './CandidateSidebar';
import { CandidateTopbar } from './CandidateTopbar';
import { useAuth } from '@/contexts/AuthContext';

export function CandidateShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login?role=candidate');
        return;
      }
      const done = typeof window !== 'undefined' && localStorage.getItem(`genuai_onboarding_done_${user.id}`) === 'true';
      if (!done) {
        router.replace('/onboarding/candidate');
      }
    }
  }, [user, isLoading, router]);

  const onboardingDone = typeof window !== 'undefined' && user?.id ? localStorage.getItem(`genuai_onboarding_done_${user.id}`) === 'true' : true;

  if (isLoading || (user && !onboardingDone)) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid #e2e8f0', borderTopColor: '#b8860b',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-layout">
      <CandidateSidebar />
      <div className="main-content">
        <CandidateTopbar />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
