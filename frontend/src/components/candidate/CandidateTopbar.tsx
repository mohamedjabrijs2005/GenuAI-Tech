'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Bell, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

const BREADCRUMB_MAP: Record<string, string> = {
  '/candidate': 'Candidate Overview',
  '/candidate/profile': 'Global Candidate Profile',
  '/candidate/vacancies': 'Explore Published Vacancies',
  '/candidate/targets': 'My Career Targets',
  '/candidate/activity': 'Candidate Activity Trail',
  '/candidate/notifications': 'Notifications',
  '/candidate/privacy': 'Privacy & Data Separation',
  '/candidate/accessibility': 'Accessibility & Accommodations',
  '/candidate/settings': 'Account Settings',
};

export function CandidateTopbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [syncTime, setSyncTime] = useState<string>('');
  const [profileCompletion, setProfileCompletion] = useState<number | null>(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  // Dynamic route titles
  let title = BREADCRUMB_MAP[pathname];
  if (!title) {
    if (pathname.includes('/requirements')) title = 'Requirement Workspace';
    else if (pathname.includes('/learn')) title = 'Target-Based Learning';
    else if (pathname.includes('/practice')) title = 'Interactive Practice';
    else if (pathname.includes('/assessment')) title = 'Official Assessment';
    else if (pathname.includes('/evidence')) title = 'Evidence Locker';
    else if (pathname.includes('/coverage')) title = 'Coverage & Gaps Dashboard';
    else if (pathname.includes('/interview')) title = 'Interview Workspace';
    else if (pathname.match(/^\/candidate\/targets\/[^/]+$/)) title = 'Target Workspace';
    else if (pathname.match(/^\/candidate\/vacancies\/[^/]+$/)) title = 'Vacancy Transparency';
    else title = 'Candidate Workspace';
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);

    // Fetch profile completion & notifications
    let isMounted = true;
    api
      .get('/candidate-portal/profile')
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.completion?.percentage !== undefined) {
          setProfileCompletion(res.data.completion.percentage);
        }
      })
      .catch(() => {});

    api
      .get('/candidate-portal/notifications')
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.notifications || [];
        setUnreadNotifsCount(list.filter((n: any) => !n.is_read).length);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [pathname]);

  return (
    <header className="topbar">
      {/* Left: page title */}
      <div style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        <h2
          style={{
            fontWeight: 800,
            fontSize: 16,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Right: status & profile actions */}
      <div className="flex items-center gap-3" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        {/* Connected state & sync timestamp */}
        <div
          className="flex items-center gap-1.5"
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: '99px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <span className="badge-dot" style={{ background: '#10b981', width: 6, height: 6 }} />
          <span style={{ color: '#059669', fontWeight: 700 }}>Connected</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', fontSize: 10.5 }}>
            Last sync: {syncTime || 'Just now'}
          </span>
        </div>

        {/* Profile completion pill */}
        {profileCompletion !== null && (
          <Link
            href="/candidate/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '99px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#854d0e',
              textDecoration: 'none',
              flexShrink: 0,
            }}
            title="View Profile Completion Checklist"
          >
            <CheckCircle2 size={13} style={{ color: '#d4af37' }} />
            <span>Profile: {profileCompletion}%</span>
          </Link>
        )}

        {/* Notifications Icon Button */}
        <Link
          href="/candidate/notifications"
          style={{
            position: 'relative',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            textDecoration: 'none',
            flexShrink: 0,
          }}
          title="Candidate Notifications"
          aria-label="Notifications"
        >
          <Bell size={15} />
          {unreadNotifsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                fontSize: 9.5,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ffffff',
              }}
            >
              {unreadNotifsCount}
            </span>
          )}
        </Link>

        {/* Candidate role badge */}
        <span
          className="badge badge-green"
          style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
          Candidate Workspace
        </span>
      </div>
    </header>
  );
}
