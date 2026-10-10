'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
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

export function AdminTopbar() {
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
      {/* Left: page title — mirrors Company Dashboard topbar */}
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

