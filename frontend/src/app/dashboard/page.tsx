'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import VerificationBadge from '@/components/VerificationBadge';
import api from '@/lib/api';
import { Building2, FolderOpen, Briefcase, ChevronRight, AlertCircle } from 'lucide-react';

interface OverviewData {
  verificationStatus: string;
  departmentCount: number;
  roleCount: number;
  draftRoleCount: number;
}

export default function OverviewPage() {
  const { user, company } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/company/overview')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load overview data.'))
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{greeting}, {user?.firstName} 👋</h1>
        <p className="page-subtitle">Here&apos;s your company workspace at a glance.</p>
      </div>

      {/* Verification status */}
      {company && (
        <VerificationBadge status={company.verificationStatus} />
      )}

      {/* Stats */}
      {loading ? (
        <div className="stats-grid">
          {[1,2,3].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 32, width: '40%' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          <AlertCircle size={15} /> {error}
        </div>
      ) : data ? (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Departments</div>
            <div className="stat-value">{data.departmentCount}</div>
            <div className="stat-sub">Active departments</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Roles</div>
            <div className="stat-value">{data.roleCount}</div>
            <div className="stat-sub">
              {data.draftRoleCount > 0 ? `${data.draftRoleCount} in draft` : 'No roles yet'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Verification</div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge badge-${data.verificationStatus.toLowerCase().replace('_', '-')}`}>
                <span className="badge-dot" style={{
                  background: data.verificationStatus === 'VERIFIED' ? 'var(--color-verified)'
                    : data.verificationStatus === 'UNDER_REVIEW' ? 'var(--color-under-review)'
                    : data.verificationStatus === 'SUSPENDED' ? 'var(--color-suspended)'
                    : 'var(--color-unverified)'
                }} />
                {data.verificationStatus.replace('_', ' ')}
              </span>
            </div>
            <div className="stat-sub">Company status</div>
          </div>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="section-title">Quick Actions</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        <Link href="/dashboard/company-profile" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textDecoration: 'none', padding: 16, transition: 'border-color 150ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-light)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-brand-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-light)', flexShrink: 0 }}>
            <Building2 size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>Company Profile</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>View & edit details</div>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
        </Link>

        <Link href="/dashboard/departments" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textDecoration: 'none', padding: 16, transition: 'border-color 150ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-light)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)', flexShrink: 0 }}>
            <FolderOpen size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>Departments</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Manage structure</div>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
        </Link>

        <Link href="/dashboard/departments?tab=roles" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textDecoration: 'none', padding: 16, transition: 'border-color 150ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-light)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)', flexShrink: 0 }}>
            <Briefcase size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>Roles</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Create & manage roles</div>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
        </Link>
      </div>
    </div>
  );
}
