'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Briefcase,
  ClipboardList,
  Users,
  ShieldCheck,
  ShieldAlert,
  Gavel,
  Shield,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { KPICard } from '@/components/admin/KPICard';
import { ActivityTimeline } from '@/components/admin/ActivityTimeline';
import { SystemStatusCard } from '@/components/admin/SystemStatusCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ChartCard } from '@/components/admin/ChartCard';
import { adminDataService, AuditRecord } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { DetailDrawer } from '@/components/admin/DetailDrawer';

export default function AdminOverviewPage() {
  const router = useRouter();
  const { adminUser } = useAdminAuth();

  const [companies, setCompanies] = useState(adminDataService.getCompanies());
  const [vacancies, setVacancies] = useState(adminDataService.getVacancies());
  const [assessments, setAssessments] = useState(adminDataService.getAssessments());
  const [users, setUsers] = useState(adminDataService.getUsers());
  const [incidents, setIncidents] = useState(adminDataService.getIntegrityIncidents());
  const [disputes, setDisputes] = useState(adminDataService.getDisputes());
  const [securityEvents, setSecurityEvents] = useState(adminDataService.getSecurityEvents());
  const [auditLogs, setAuditLogs] = useState(adminDataService.getAuditLogs());
  const [systemHealth, setSystemHealth] = useState(adminDataService.getSystemHealth());
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditRecord | null>(null);

  const refreshData = () => {
    setCompanies(adminDataService.getCompanies());
    setVacancies(adminDataService.getVacancies());
    setAssessments(adminDataService.getAssessments());
    setUsers(adminDataService.getUsers());
    setIncidents(adminDataService.getIntegrityIncidents());
    setDisputes(adminDataService.getDisputes());
    setSecurityEvents(adminDataService.getSecurityEvents());
    setAuditLogs(adminDataService.getAuditLogs());
    setSystemHealth(adminDataService.getSystemHealth());
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refreshData);
    return () => unsub();
  }, []);

  // Metrics computation
  const pendingCompanies = companies.filter((c) => c.verificationStatus === 'Pending' || c.verificationStatus === 'Under Review');
  const pendingVacancies = vacancies.filter((v) => v.status === 'Pending Review');
  const pendingAssessments = assessments.filter((a) => a.status === 'Pending Review' || a.status === 'Flagged');
  const openIncidents = incidents.filter((i) => i.status === 'Open' || i.status === 'Under Investigation');
  const openDisputes = disputes.filter((d) => d.status === 'Open' || d.status === 'Investigating');
  const activeSecurityEvents = securityEvents.filter((s) => s.status === 'Active' || s.status === 'Investigating');

  // Chart telemetry data
  const throughputData = [
    { label: 'Mon', value: 34 },
    { label: 'Tue', value: 48 },
    { label: 'Wed', value: 42 },
    { label: 'Thu', value: 65 },
    { label: 'Fri', value: 58 },
    { label: 'Sat', value: 24 },
    { label: 'Sun', value: 31 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.6px', margin: 0 }}>
              GenuAI Admin Console
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '99px',
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#854d0e',
                border: '1px solid rgba(212, 175, 55, 0.4)',
              }}
            >
              Enterprise Governance Root
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Monitor platform verification, trust, governance and system health.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={refreshData}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid var(--border)',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} /> Refresh Stream
          </button>
          <Link
            href="/admin/audit"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#b8860b',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(184, 134, 11, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Inspect Immutable Audit
          </Link>
        </div>
      </div>

      {/* 8 Primary Platform Governance KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <KPICard
          title="Total Companies"
          value={companies.length}
          subtitle="Registered corporate tenants"
          icon={Building2}
          onClick={() => router.push('/admin/verification/companies')}
          trend={{ value: '+2 this month', isPositive: true }}
        />
        <KPICard
          title="Pending Verifications"
          value={pendingCompanies.length}
          subtitle="Awaiting corporate audit"
          icon={ShieldAlert}
          highlight={pendingCompanies.length > 0 ? 'warning' : 'neutral'}
          badgeText={pendingCompanies.length > 0 ? 'Action Queue' : undefined}
          onClick={() => router.push('/admin/verification/companies')}
        />
        <KPICard
          title="Active Vacancies"
          value={vacancies.length}
          subtitle="Published role specifications"
          icon={Briefcase}
          onClick={() => router.push('/admin/verification/vacancies')}
        />
        <KPICard
          title="Vacancies Pending Review"
          value={pendingVacancies.length}
          subtitle="Awaiting taxonomy review"
          icon={Briefcase}
          highlight={pendingVacancies.length > 0 ? 'warning' : 'neutral'}
          onClick={() => router.push('/admin/verification/vacancies')}
        />
        <KPICard
          title="Assessments Pending Review"
          value={pendingAssessments.length}
          subtitle="Requires integrity config sign-off"
          icon={ClipboardList}
          highlight={pendingAssessments.length > 0 ? 'danger' : 'neutral'}
          badgeText={pendingAssessments.length > 0 ? 'Requires Sign-off' : undefined}
          onClick={() => router.push('/admin/verification/assessments')}
        />
        <KPICard
          title="Platform Users"
          value={users.length}
          subtitle="Governed accounts & RBAC"
          icon={Users}
          onClick={() => router.push('/admin/users')}
        />
        <KPICard
          title="Open Integrity Incidents"
          value={openIncidents.length}
          subtitle="Observable signal reviews"
          icon={ShieldCheck}
          highlight={openIncidents.length > 0 ? 'danger' : 'neutral'}
          onClick={() => router.push('/admin/integrity')}
        />
        <KPICard
          title="Open Disputes"
          value={openDisputes.length}
          subtitle="Candidate / Company cases"
          icon={Gavel}
          highlight={openDisputes.length > 0 ? 'warning' : 'neutral'}
          onClick={() => router.push('/admin/disputes')}
        />
      </div>

      {/* Main Grid: Action Queue (Left) & Platform Activity + System Status (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Left Column: ACTION QUEUE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Administrative Action Queue
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Critical verification, review, dispute, and security tasks requiring attention
                </p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                }}
              >
                {pendingCompanies.length + pendingVacancies.length + pendingAssessments.length + openIncidents.length + openDisputes.length + activeSecurityEvents.length} Tasks
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {/* 1. Companies Awaiting Verification */}
              {pendingCompanies.slice(0, 2).map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => router.push('/admin/verification/companies')}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                  className="hover:bg-amber-50/50"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(212, 175, 55, 0.15)',
                        color: '#854d0e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Company Verification: {comp.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        Domain: {comp.domain} • Submitted: {comp.submittedDate}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status={comp.verificationStatus} />
                    <ArrowRight size={14} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}

              {/* 2. Vacancies Requiring Review */}
              {pendingVacancies.slice(0, 2).map((vac) => (
                <div
                  key={vac.id}
                  onClick={() => router.push('/admin/verification/vacancies')}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                  className="hover:bg-amber-50/50"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#fffbeb',
                        color: '#b45309',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Vacancy Governance: {vac.roleTitle}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {vac.companyName} • Completeness: {vac.completenessScore}%
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status={vac.status} />
                    <ArrowRight size={14} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}

              {/* 3. Assessments Requiring Review / Flagged */}
              {pendingAssessments.slice(0, 2).map((asm) => (
                <div
                  key={asm.id}
                  onClick={() => router.push('/admin/verification/assessments')}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                  className="hover:bg-amber-50/50"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ClipboardList size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Assessment Sign-off: {asm.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {asm.companyName} • Type: {asm.assessmentType}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status={asm.status} />
                    <ArrowRight size={14} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}

              {/* 4. Integrity Incidents Requiring Review */}
              {openIncidents.slice(0, 1).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => router.push('/admin/integrity')}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                  className="hover:bg-amber-50/50"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Integrity Incident: {inc.id} ({inc.candidateMaskedId})
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {inc.signals.length} Signals Detected • {inc.companyName}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status="Action Required" />
                    <ArrowRight size={14} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}

              {/* 5. Open Disputes */}
              {openDisputes.slice(0, 1).map((dsp) => (
                <div
                  key={dsp.id}
                  onClick={() => router.push('/admin/disputes')}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-amber-50/50"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#faf5ff',
                        color: '#7e22ce',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Gavel size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Dispute Arbitration: {dsp.id}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {dsp.type} • {dsp.companyName}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status={dsp.status} />
                    <ArrowRight size={14} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}

              {/* Empty state when queue is clear */}
              {pendingCompanies.length === 0 && pendingVacancies.length === 0 && pendingAssessments.length === 0 && openIncidents.length === 0 && openDisputes.length === 0 && (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <CheckCircle2 size={32} style={{ color: '#059669', margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>All Clear</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>No pending governance actions. All items are up to date.</div>
                </div>
              )}
            </div>
          </div>

          {/* Platform Activity Volume Chart */}
          <ChartCard
            title="Platform Governance Activity Stream"
            subtitle="7-day volume of verification events and audit submissions"
            data={throughputData}
            totalLabel="Actions Logged This Week"
            badge="Audited"
          />
        </div>

        {/* Right Column: RECENT PLATFORM ACTIVITY & REALTIME SYSTEM STATUS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Realtime System Subsystems Status */}
          <SystemStatusCard subsystems={systemHealth.subsystems} />

          {/* Recent Platform Activity Timeline */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '12px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Recent Platform Activity
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Live append-only audit stream across all platform entities
                </p>
              </div>
              <Link
                href="/admin/audit"
                style={{ fontSize: '11.5px', fontWeight: 700, color: '#b8860b', textDecoration: 'none' }}
              >
                View Full Audit &rarr;
              </Link>
            </div>

            <ActivityTimeline
              logs={auditLogs}
              onSelectLog={(log) => setSelectedAuditLog(log)}
              maxItems={6}
            />
          </div>
        </div>
      </div>

      {/* Audit Detail Drawer for clicked timeline event */}
      <DetailDrawer
        isOpen={!!selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
        title="Audit Record Detail"
        subtitle={selectedAuditLog?.id}
      >
        {selectedAuditLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Action
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedAuditLog.action}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Actor</div>
                <div style={{ fontWeight: 600 }}>{selectedAuditLog.actor}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Role</div>
                <div style={{ fontWeight: 600 }}>{selectedAuditLog.role}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Entity</div>
                <div style={{ fontWeight: 600 }}>{selectedAuditLog.entity}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Entity ID</div>
                <div style={{ fontFamily: 'monospace' }}>{selectedAuditLog.entityId}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Timestamp</div>
                <div>{selectedAuditLog.timestamp}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>IP Address</div>
                <div style={{ fontFamily: 'monospace' }}>{selectedAuditLog.ipAddress || '—'}</div>
              </div>
            </div>

            {selectedAuditLog.metadata && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Recorded Metadata
                </div>
                <pre
                  style={{
                    background: '#0f172a',
                    color: '#f8fafc',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    overflowX: 'auto',
                  }}
                >
                  {JSON.stringify(selectedAuditLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
