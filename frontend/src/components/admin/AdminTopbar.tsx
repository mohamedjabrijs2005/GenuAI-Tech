'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Menu } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/verification/companies': 'Company Verification',
  '/admin/verification/vacancies': 'Vacancy Moderation',
  '/admin/verification/assessments': 'Assessment Review',
  '/admin/users': 'User Management',
  '/admin/disputes': 'Reports & Disputes',
  '/admin/integrity': 'Integrity Review',
  '/admin/audit': 'Audit Trail',
  '/admin/settings': 'Settings',
};

interface AdminTopbarProps {
  onToggleMobileSidebar?: () => void;
}

export function AdminTopbar({ onToggleMobileSidebar }: AdminTopbarProps) {
  const pathname = usePathname();
  const { adminUser } = useAdminAuth();
  const [time, setTime] = useState('');

  // Live clock — matches Company Dashboard topbar pattern
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const title = BREADCRUMB_MAP[pathname] || 'Admin Console';

  return (
    <header className="topbar">
      {/* Left: page title & hamburger button */}
      <div className="flex items-center gap-2.5 min-w-0" style={{ flexShrink: 1, overflow: 'hidden' }}>
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="topbar-mobile-btn"
            aria-label="Toggle admin navigation"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: '#f8fafc',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>
        )}
        <h2
          style={{
            fontWeight: 800,
            fontSize: 16,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Right: status + role */}
      <div className="flex items-center gap-3" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        {/* Live sync indicator — mirrors Company Dashboard LIVE badge */}
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
          <span className="badge-dot-live" />
          <span style={{ color: 'var(--success)', fontWeight: 700 }}>LIVE</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {time || 'Syncing...'}
          </span>
        </div>

        {/* Admin role badge — mirrors Company Dashboard verification badge */}
        <span
          className="badge badge-yellow"
          style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <ShieldCheck size={13} style={{ color: 'var(--warning)' }} />
          {adminUser.role || 'Super Admin'}
        </span>
      </div>
    </header>
  );
}

