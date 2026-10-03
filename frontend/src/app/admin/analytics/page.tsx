'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Building2,
  Briefcase,
  ClipboardList,
  FileCheck,
  Mic2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { KPICard } from '@/components/admin/KPICard';
import { ChartCard } from '@/components/admin/ChartCard';
import { DataTable, Column } from '@/components/admin/DataTable';

export default function PlatformAnalyticsPage() {
  const companyGrowth = [
    { label: 'May', value: 4 },
    { label: 'Jun', value: 8 },
    { label: 'Jul', value: 12 },
    { label: 'Aug', value: 18 },
    { label: 'Sep', value: 24 },
    { label: 'Oct', value: 31 },
  ];

  const vacancyCreation = [
    { label: 'May', value: 12 },
    { label: 'Jun', value: 25 },
    { label: 'Jul', value: 40 },
    { label: 'Aug', value: 58 },
    { label: 'Sep', value: 76 },
    { label: 'Oct', value: 92 },
  ];

  const assessmentCompletions = [
    { label: 'May', value: 110 },
    { label: 'Jun', value: 240 },
    { label: 'Jul', value: 420 },
    { label: 'Aug', value: 680 },
    { label: 'Sep', value: 940 },
    { label: 'Oct', value: 1280 },
  ];

  const verificationSLA = [
    { label: '< 4h', value: 42 },
    { label: '4-12h', value: 35 },
    { label: '12-24h', value: 18 },
    { label: '> 24h', value: 5 },
  ];

  interface TenantUsageRow {
    company: string;
    domain: string;
    vacancies: number;
    assessmentsCompleted: number;
    evidenceItems: number;
    complianceScore: number;
  }

  const tenantTableData: TenantUsageRow[] = [
    {
      company: 'Nexus FinTech Global',
      domain: 'nexusfintech.io',
      vacancies: 8,
      assessmentsCompleted: 412,
      evidenceItems: 1240,
      complianceScore: 99,
    },
    {
      company: 'Apex Neural Systems Ltd',
      domain: 'apexneural.com',
      vacancies: 4,
      assessmentsCompleted: 280,
      evidenceItems: 840,
      complianceScore: 94,
    },
    {
      company: 'CloudScale Infrastructure Inc',
      domain: 'cloudscale.net',
      vacancies: 6,
      assessmentsCompleted: 310,
      evidenceItems: 930,
      complianceScore: 98,
    },
    {
      company: 'Quantum BioHealth Analytics',
      domain: 'quantumbiohealth.ch',
      vacancies: 5,
      assessmentsCompleted: 195,
      evidenceItems: 585,
      complianceScore: 100,
    },
  ];

  const columns: Column<TenantUsageRow>[] = [
    {
      key: 'company',
      header: 'Corporate Tenant',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
            {item.company}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.domain}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'vacancies',
      header: 'Governed Vacancies',
      render: (item) => <span style={{ fontWeight: 600 }}>{item.vacancies} Roles</span>,
      sortable: true,
    },
    {
      key: 'assessmentsCompleted',
      header: 'Assessments Executed',
      render: (item) => (
        <span style={{ fontWeight: 700, color: '#1e293b' }}>
          {item.assessmentsCompleted.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'evidenceItems',
      header: 'Evidence Vault Items',
      render: (item) => (
        <span style={{ fontWeight: 700, color: '#b8860b' }}>
          {item.evidenceItems.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'complianceScore',
      header: 'Platform Trust Index',
      render: (item) => (
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '99px',
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
          }}
        >
          {item.complianceScore}% Compliant
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Platform Intelligence & Macro Analytics
          </h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '99px',
              background: 'rgba(212, 175, 55, 0.15)',
              color: '#854d0e',
            }}
          >
            System-Wide Metrics
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Macro governance intelligence tracking tenant adoption, assessment throughput, evidence vault volume, and SLA turnaround.
        </p>
      </div>

      {/* Primary KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <KPICard title="Total Verified Tenants" value="31 Companies" subtitle="+7 this quarter" icon={Building2} />
        <KPICard title="Active Vacancies" value="92 Vacancies" subtitle="Across 14 industries" icon={Briefcase} />
        <KPICard title="Completed Assessments" value="1,280 Tests" subtitle="Verified sandbox runs" icon={ClipboardList} highlight="gold" />
        <KPICard title="Evidence Vault Volume" value="3,595 Artifacts" subtitle="Cryptographically sealed" icon={FileCheck} />
      </div>

      {/* Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <ChartCard
          title="Tenant Company Growth"
          subtitle="Total verified enterprise organizations on GenuAI"
          data={companyGrowth}
          totalLabel="Active Companies"
          color="#b8860b"
        />
        <ChartCard
          title="Vacancy Specification Creation"
          subtitle="Monthly volume of structured vacancies submitted"
          data={vacancyCreation}
          totalLabel="Total Vacancies"
          color="#854d0e"
        />
        <ChartCard
          title="Assessment Execution Volume"
          subtitle="Cumulative technical sandbox tests completed"
          data={assessmentCompletions}
          totalLabel="Assessment Runs"
          color="#059669"
        />
        <ChartCard
          title="Verification SLA Turnaround Distribution"
          subtitle="Hours to complete official corporate and vacancy reviews"
          type="bar"
          data={verificationSLA}
          totalLabel="% in Target SLA"
          color="#d4af37"
        />
      </div>

      {/* Tenant Governance Activity Table */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Tenant Governance & Execution Overview
        </h3>
        <DataTable
          columns={columns}
          data={tenantTableData}
          keyExtractor={(item) => item.company}
        />
      </div>
    </div>
  );
}
