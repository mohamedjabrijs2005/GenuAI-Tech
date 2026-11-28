'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Briefcase,
  ClipboardList,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { KPICard } from '@/components/admin/KPICard';
import { ChartCard } from '@/components/admin/ChartCard';
import { DataTable, Column } from '@/components/admin/DataTable';
import api from '@/lib/api';

interface FunnelMetric {
  count: number;
  lastSeen: string | null;
}

type FunnelMap = Record<string, FunnelMetric>;

interface FunnelRow {
  event: string;
  label: string;
  count: number;
  lastSeen: string | null;
}

const EVENT_LABELS: Record<string, string> = {
  vacancy_created: 'Vacancy Created',
  checklist_approved: 'Checklist Approved',
  candidate_applied: 'Candidate Applied',
  skill_claim_confirmed: 'Skill Claim Confirmed',
  shortlist_viewed: 'Shortlist Viewed',
  assessment_invited: 'Assessment Invited',
  interview_stage_updated: 'Interview Stage Updated',
  hr_override_used: 'HR Override Used',
  hiring_outcome_recorded: 'Hiring Outcome Recorded',
};

export default function PlatformAnalyticsPage() {
  const [funnel, setFunnel] = useState<FunnelMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFunnel = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/analytics/pilot-funnel');
      setFunnel(res.data?.funnel || {});
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load pilot funnel analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFunnel();
  }, [loadFunnel]);

  const rows: FunnelRow[] = Object.keys(EVENT_LABELS).map((key) => ({
    event: key,
    label: EVENT_LABELS[key],
    count: funnel[key]?.count ?? 0,
    lastSeen: funnel[key]?.lastSeen || null,
  }));

  const chartData = rows.map((r) => ({
    label: r.label.split(' ').slice(0, 2).join(' '),
    value: r.count,
  }));

  const columns: Column<FunnelRow>[] = [
    {
      key: 'label',
      header: 'Pilot Funnel Stage',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>{item.label}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{item.event}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'count',
      header: 'Recorded Events',
      render: (item) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{item.count.toLocaleString()}</span>,
      sortable: true,
    },
    {
      key: 'lastSeen',
      header: 'Last Activity',
      render: (item) => (
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {item.lastSeen ? new Date(item.lastSeen).toLocaleString() : 'No events yet'}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Platform Pilot Funnel Analytics
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: 'rgba(5, 150, 105, 0.12)',
                color: '#065f46',
              }}
            >
              Live Telemetry
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Real-time event counts from the core GenuAI vacancy, checklist, application, shortlist, and outcome funnel.
          </p>
        </div>

        <button
          type="button"
          onClick={loadFunnel}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
        <KPICard title="Vacancies Created" value={String(funnel.vacancy_created?.count ?? 0)} subtitle="Core vacancy events" icon={Briefcase} />
        <KPICard title="Checklists Approved" value={String(funnel.checklist_approved?.count ?? 0)} subtitle="Locked/approved matrices" icon={CheckCircle2} />
        <KPICard title="Candidate Applications" value={String(funnel.candidate_applied?.count ?? 0)} subtitle="Vacancy targets created" icon={UserCheck} highlight="gold" />
        <KPICard title="Skill Claims Confirmed" value={String(funnel.skill_claim_confirmed?.count ?? 0)} subtitle="Candidate claim proofs" icon={FileCheck} />
        <KPICard title="Shortlist Views" value={String(funnel.shortlist_viewed?.count ?? 0)} subtitle="HR shortlist checks" icon={ClipboardList} />
        <KPICard title="HR Overrides / Outcomes" value={`${funnel.hr_override_used?.count ?? 0} / ${funnel.hiring_outcome_recorded?.count ?? 0}`} subtitle="Overrides / Outcomes" icon={SlidersHorizontal} />
      </div>

      <ChartCard
        title="Pilot Funnel Event Distribution"
        subtitle="Cumulative recorded events per workflow stage"
        type="bar"
        data={chartData}
        totalLabel="Funnel Stages"
        color="#b8860b"
      />

      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Funnel Event Breakdown
        </h3>
        <DataTable columns={columns} data={rows} keyExtractor={(item) => item.event} />
      </div>
    </div>
  );
}
