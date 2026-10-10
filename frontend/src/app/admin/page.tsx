'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Briefcase,
  Globe,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  ScrollText,
} from 'lucide-react';
import api from '@/lib/api';

interface MetricData {
  pendingCompanyVerifications: number;
  vacanciesPendingReview: number;
  publishedVacancies: number;
  openGovernanceCases?: number | null;
}

interface ActionQueueCompany {
  id: string;
  name: string;
  workEmail: string;
  website: string;
  industry: string;
  country: string;
  verificationStatus: string;
  submittedDate: string;
}

interface ActionQueueVacancy {
  id: string;
  companyId: string;
  companyName: string;
  roleTitle: string;
  department: string;
  requirementCount: number;
  status: string;
  submittedDate: string;
}

interface AuditActivity {
  id: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  companyName?: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
  reason?: string;
}

export default function AdminOverviewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [pendingCompanies, setPendingCompanies] = useState<ActionQueueCompany[]>([]);
  const [pendingVacancies, setPendingVacancies] = useState<ActionQueueVacancy[]>([]);
  const [recentActivities, setRecentActivities] = useState<AuditActivity[]>([]);

  const fetchOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/overview');
      const data = res.data || {};
      setMetrics(data.metrics || {});
      setPendingCompanies(data.actionQueue?.pendingCompanies || []);
      setPendingVacancies(data.actionQueue?.pendingVacancies || []);
      setRecentActivities(data.recentActivity || []);
    } catch (err: any) {
      console.error('Failed to fetch admin overview:', err);
      setError('We could not load platform metrics from PostgreSQL. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Action required items calculated directly from backend response queues
  const actionItems: {
    type: string;
    title: string;
    relatedEntity: string;
    date: string;
    actionLabel: string;
    actionHref: string;
  }[] = [];

  pendingCompanies.forEach((c) => {
    actionItems.push({
      type: 'Company Verification',
      title: `Verification pending for ${c.name}`,
      relatedEntity: c.name,
      date: c.submittedDate || 'Recently',
      actionLabel: 'Review company',
      actionHref: `/admin/verification/companies?id=${c.id}`,
    });
  });

  pendingVacancies.forEach((v) => {
    actionItems.push({
      type: 'Vacancy Moderation',
      title: `Vacancy review required: ${v.roleTitle}`,
      relatedEntity: `${v.companyName || 'Company'} (${v.requirementCount} requirements)`,
      date: v.submittedDate || 'Recently',
      actionLabel: 'Review vacancy',
      actionHref: `/admin/verification/vacancies?id=${v.id}`,
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Operational Control Center</h1>
            <p className="page-subtitle">
              Monitor verification queues, moderation work, platform activity, and governance actions.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={fetchOverviewData}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link href="/admin/audit" className="btn btn-gold btn-sm">
              <ScrollText size={14} /> Audit Trail
            </Link>
          </div>
        </div>
      </div>

      {/* Error state if API call failed */}
      {error && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} style={{ color: '#dc2626' }} />
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchOverviewData}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="stats-grid">
        {/* Card 1: Companies Pending Verification */}
        <Link href="/admin/verification/companies?status=PENDING_VERIFICATION" style={{ textDecoration: 'none' }}>
          <div className="stat-card stat-card-gold" style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-icon-gold">
              <Building2 size={20} />
            </div>
            <div className="stat-label">Companies Pending Verification</div>
            <div className="stat-value">
              {loading ? '…' : (metrics?.pendingCompanyVerifications ?? 0)}
            </div>
            <div className="stat-sub">Pending identity verification</div>
          </div>
        </Link>

        {/* Card 2: Vacancies Pending Review */}
        <Link href="/admin/verification/vacancies?status=PENDING_ADMIN_REVIEW" style={{ textDecoration: 'none' }}>
          <div className="stat-card stat-card-warning" style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-icon-warning">
              <Briefcase size={20} />
            </div>
            <div className="stat-label">Vacancies Pending Review</div>
            <div className="stat-value">
              {loading ? '…' : (metrics?.vacanciesPendingReview ?? 0)}
            </div>
            <div className="stat-sub">Submitted for moderation review</div>
          </div>
        </Link>

        {/* Card 3: Published Vacancies */}
        <Link href="/admin/verification/vacancies?status=PUBLISHED" style={{ textDecoration: 'none' }}>
          <div className="stat-card stat-card-success" style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-icon-success">
              <Globe size={20} />
            </div>
            <div className="stat-label">Published Vacancies</div>
            <div className="stat-value">
              {loading ? '…' : (metrics?.publishedVacancies ?? 0)}
            </div>
            <div className="stat-sub">Currently visible to candidates</div>
          </div>
        </Link>

        {/* Card 4: Open Governance Cases */}
        <div className="stat-card" style={{ borderTop: '3px solid #64748b' }}>
          <div className="stat-icon" style={{ background: '#f1f5f9', color: '#475569' }}>
            <ShieldAlert size={20} />
          </div>
          <div className="stat-label">Open Governance Cases</div>
          <div className="stat-value" style={{ fontSize: '24px', color: '#64748b', marginTop: '4px' }}>
            —
          </div>
          <div className="stat-sub" style={{ color: '#64748b', fontWeight: 600 }}>
            Governance case module not yet active
          </div>
        </div>
      </div>

      {/* Prominent Action Required Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: '#d97706' }} />
              Action Required
            </h3>
            <p className="card-subtitle">
              Platform governance actions, company verifications, and vacancy moderation items awaiting decision.
            </p>
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '99px',
              background: actionItems.length > 0 ? '#fef3c7' : '#f1f5f9',
              color: actionItems.length > 0 ? '#92400e' : '#475569',
              border: `1px solid ${actionItems.length > 0 ? '#fde68a' : '#cbd5e1'}`,
            }}
          >
            {actionItems.length} {actionItems.length === 1 ? 'item requiring action' : 'items requiring action'}
          </span>
        </div>

        {actionItems.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              background: '#fafaf9',
              borderRadius: '8px',
              border: '1px border var(--border)',
            }}
          >
            <CheckCircle2 size={32} style={{ color: '#059669', margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No governance actions require attention right now.
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              All current platform queues are clear.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {actionItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.type}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Submitted {item.date}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Related: {item.relatedEntity}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <Link href={item.actionHref} className="btn btn-gold btn-sm">
                    {item.actionLabel} <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Queue Preview (2 Panels Side-by-Side) */}
      <div className="grid-2">
        {/* Panel 1: Companies Awaiting Verification */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Companies awaiting verification</h3>
              <p className="card-subtitle">Recent registrations pending identity review</p>
            </div>
            <Link href="/admin/verification/companies" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {pendingCompanies.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No companies are waiting for verification.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingCompanies.slice(0, 5).map((comp) => (
                <div
                  key={comp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {comp.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      {comp.industry || 'Technology'} · Registered {comp.submittedDate}
                    </div>
                  </div>
                  <Link href={`/admin/verification/companies?id=${comp.id}`} className="btn btn-secondary btn-sm">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Vacancies Awaiting Review */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Vacancies awaiting review</h3>
              <p className="card-subtitle">Recruitment roles submitted for moderation</p>
            </div>
            <Link href="/admin/verification/vacancies" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {pendingVacancies.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No vacancies are waiting for moderation review.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingVacancies.slice(0, 5).map((vac) => (
                <div
                  key={vac.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {vac.roleTitle}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      {vac.companyName} · {vac.requirementCount} requirements · Submitted {vac.submittedDate}
                    </div>
                  </div>
                  <Link href={`/admin/verification/vacancies?id=${vac.id}`} className="btn btn-secondary btn-sm">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Administrative Activity */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: '#b8860b' }} />
              Recent administrative activity
            </h3>
            <p className="card-subtitle">Append-only log of platform governance decisions recorded in PostgreSQL</p>
          </div>
          <Link href="/admin/audit" className="btn btn-secondary btn-sm">
            View full audit trail
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            No administrative activity has been recorded yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor</th>
                  <th>Timestamp</th>
                  <th>State Transition</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.slice(0, 10).map((act) => (
                  <tr key={act.id}>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: '#f1f5f9',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                        }}
                      >
                        {act.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{act.entity}</div>
                      {act.companyName && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {act.companyName}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{act.actor}</div>
                      <div style={{ fontSize: '11px', color: '#854d0e' }}>{act.role}</div>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {act.timestamp}
                    </td>
                    <td>
                      {act.previousState && act.newState ? (
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>
                          <span style={{ color: '#dc2626' }}>{act.previousState}</span>
                          <span style={{ margin: '0 6px', color: '#94a3b8' }}>→</span>
                          <span style={{ color: '#059669' }}>{act.newState}</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
