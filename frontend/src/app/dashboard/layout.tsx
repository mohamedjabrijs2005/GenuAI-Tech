'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, company, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  const isOnboarding = pathname?.includes('/onboarding');
  const isVerificationStatus = pathname?.includes('/verification-status');

  const isAdmin = user ? ['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes((user.role || '').toUpperCase()) : false;
  const localDone = typeof window !== 'undefined' && user?.id ? localStorage.getItem(`genuai_onboarding_done_${user.id}`) === 'true' : false;
  const onboardingSubmitted = isAdmin || isVerificationStatus || company?.onboardingSubmitted === true || localDone;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login?role=company');
        return;
      }
      const role = (user.role || '').toUpperCase();
      if (role === 'CANDIDATE' || role === 'APPLICANT') {
        router.replace('/candidate');
        return;
      }
      if (!isOnboarding && !onboardingSubmitted) {
        router.replace('/dashboard/onboarding');
      }
    }
  }, [user, company, isLoading, router, isOnboarding, onboardingSubmitted]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  if (isLoading || (user && !onboardingSubmitted)) {
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
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="sidebar-backdrop"
          aria-hidden="true"
        />
      )}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <div className="main-content">
        <Topbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
