'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/company-profile': 'Company Profile',
  '/dashboard/vacancies': 'Vacancies & Roles',
  '/dashboard/readiness': 'Role Readiness Funnel',
  '/dashboard/requirements': 'Role Requirements',
  '/dashboard/assessments': 'Assessment Groups & Results',
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
  '/dashboard/audit': 'Audit Log',
  '/dashboard/departments': 'Departments',
};

interface TopbarProps {
  onToggleMobileSidebar?: () => void;
}

export default function Topbar({ onToggleMobileSidebar }: TopbarProps) {
  const pathname = usePathname();
  const { company } = useAuth();

  // Dynamic candidate detail route support
  const candidateDetailMatch = pathname.match(/^\/dashboard\/candidates\/(c\d+|[\w-]+)$/);
  const vacancyDetailMatch = pathname.match(/^\/dashboard\/vacancies\/([\w-]+)$/);

  const title = candidateDetailMatch
    ? `Candidate Detail`
    : vacancyDetailMatch
    ? `Vacancy Details`
    : BREADCRUMB_MAP[pathname] || 'Dashboard';

  const rawStatus = (company?.verificationStatus || '').toUpperCase();
  const isVerified = rawStatus === 'VERIFIED' || rawStatus === 'APPROVED';

  return (
    <header className="topbar">
      {/* Title & Mobile Toggle (Left) */}
      <div className="flex items-center gap-2.5 min-w-0" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="topbar-mobile-btn"
            aria-label="Toggle navigation menu"
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

      {/* Utilities (Right) */}
      <div className="flex items-center gap-2" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        {/* Connected Sync Indicator */}
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
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span className="topbar-hide-mobile" style={{ color: '#059669', fontWeight: 700 }}>Connected</span>
        </div>

        {/* Company Verification Status Pill */}
        {isVerified ? (
          <span className="badge badge-green topbar-compact-mobile" style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
            Approved
          </span>
        ) : (
          <span className="badge badge-yellow topbar-compact-mobile" style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <ShieldCheck size={13} style={{ color: 'var(--warning)' }} />
            {rawStatus === 'PENDING_VERIFICATION' ? 'Pending' : rawStatus.replace(/_/g, ' ') || 'Pending'}
          </span>
        )}
      </div>
    </header>
  );
}
