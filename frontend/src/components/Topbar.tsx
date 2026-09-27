'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, ShieldCheck } from 'lucide-react';

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/company-profile': 'Company Profile',
  '/dashboard/vacancies': 'Vacancies & Roles',
  '/dashboard/requirements': 'Role Requirements',
  '/dashboard/assessments': 'Assessment Setup',
  '/dashboard/candidates': 'Candidates Pipeline',
  '/dashboard/evidence': 'Evidence & Coverage',
  '/dashboard/interviews': 'Interviews',
  '/dashboard/integrity': 'Integrity Review',
  '/dashboard/intelligence': 'Recruiter Intelligence',
  '/dashboard/intelligence/role-intelligence': 'Cross-Company Role Intelligence',
  '/dashboard/vacancies/builder': 'Guided Vacancy Builder',
  '/dashboard/reports': 'Intelligence Reports',
  '/dashboard/notifications': 'Live Notifications',
  '/dashboard/agreement': 'Company Agreement',
  '/dashboard/settings': 'Settings & Preferences',
};

export default function Topbar() {
  const pathname = usePathname();
  const title = BREADCRUMB_MAP[pathname] || 'Dashboard';
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topbar">
      {/* Title (Left) */}
      <div className="flex items-center gap-2.5" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        <h2 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', margin: 0 }}>
          {title}
        </h2>
      </div>

      {/* Utilities & Live Ticker (Right) */}
      <div className="flex items-center gap-3" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        {/* Live Real-time Sync Indicator */}
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
          <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{time || 'Syncing...'}</span>
        </div>

        {/* Global Search Box */}
        <div className="search-box" style={{ width: '170px', padding: '5px 10px', flexShrink: 0 }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search..." style={{ fontSize: '12.5px' }} />
        </div>

        {/* Live Notifications Button */}
        <button
          className="btn btn-secondary btn-icon"
          title="Notifications"
          aria-label="Notifications"
          style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}
        >
          <Bell size={15} style={{ color: 'var(--text-secondary)' }} />
          <span
            style={{
              position: 'absolute', top: 6, right: 6,
              width: 7, height: 7, borderRadius: '50%',
              background: '#d4af37', border: '1.5px solid var(--white)',
            }}
          />
        </button>

        {/* Verification Pill */}
        <span className="badge badge-green" style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
          Verified Entity
        </span>
      </div>
    </header>
  );
}
