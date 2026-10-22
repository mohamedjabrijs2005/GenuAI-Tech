'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CandidateSidebar } from './CandidateSidebar';
import { CandidateTopbar } from './CandidateTopbar';
import { useAuth } from '@/contexts/AuthContext';

export function CandidateShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, candidateOnboardingSubmitted } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const isOnboarding = pathname?.includes('/onboarding');

  // localDone as fallback for clients where refreshAuth hasn't returned yet
  const localDone = typeof window !== 'undefined' && user?.id
    ? localStorage.getItem(`genuai_onboarding_done_${user.id}`) === 'true'
    : false;

  const onboardingDone = candidateOnboardingSubmitted || localDone;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login?role=candidate');
        return;
      }
      const role = (user.role || '').toUpperCase();
      if (role !== 'CANDIDATE' && role !== 'APPLICANT' && role !== 'USER') {
        router.replace('/dashboard');
        return;
      }
      if (!isOnboarding && !onboardingDone) {
        router.replace('/candidate/onboarding');
      }
    }
  }, [user, isLoading, router, isOnboarding, onboardingDone]);

  if (isOnboarding) {
    return <>{children}</>;
  }

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
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="sidebar-backdrop"
          aria-hidden="true"
        />
      )}
      <CandidateSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      <div className="main-content">
        <CandidateTopbar onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
