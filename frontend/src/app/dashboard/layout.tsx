'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  const isOnboarding = pathname?.includes('/onboarding');
  const isVerificationStatus = pathname?.includes('/verification-status');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login?role=company');
        return;
      }
      if (user.role !== 'PLATFORM_ADMIN' && !isOnboarding && !isVerificationStatus) {
        const done = typeof window !== 'undefined' && localStorage.getItem(`genuai_onboarding_done_${user.id}`) === 'true';
        if (!done) {
          router.replace('/dashboard/onboarding');
        }
      }
    }
  }, [user, isLoading, router, isOnboarding, isVerificationStatus]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  const onboardingDone = typeof window !== 'undefined' && user?.id ? (user.role === 'PLATFORM_ADMIN' || isVerificationStatus || localStorage.getItem(`genuai_onboarding_done_${user.id}`) === 'true') : true;

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
        <main>{children}</main>
      </div>
    </div>
  );
}
