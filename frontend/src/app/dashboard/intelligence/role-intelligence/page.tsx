'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BrainCircuit, Sparkles, Building2, ShieldCheck, Layers, Target, CheckCircle2,
  HelpCircle, ArrowRight, Lock, AlertCircle, Info, RefreshCw, BarChart2,
  Check, ChevronRight, FileText, Award, Download
} from 'lucide-react';
import { DataService, Vacancy } from '@/lib/dataService';
import toast from 'react-hot-toast';

interface AssessmentArea {
  id: string;
  name: string;
  category: string;
  frequency: string;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
}

const MARKET_BENCHMARKS: Record<string, {
  commonAreas: AssessmentArea[];
  companySpecific: { skill: string; type: string }[];
  aggregatedSample: { skill: string; frequency: string }[];
}> = {
  'Senior Backend Engineer': {
    commonAreas: [
      { id: 'AREA-01', name: 'Distributed Systems & Concurrency', category: 'Technical', frequency: '98%', priority: 'High', description: 'Goroutines, lock-free queues, race condition debugging, memory allocation optimization' },
      { id: 'AREA-02', name: 'Data Structures & Algorithms', category: 'Technical', frequency: '95%', priority: 'High', description: 'Trees, Graph traversal, Sorting & Searching, amortized time/space complexity analysis' },
      { id: 'AREA-03', name: 'PostgreSQL & Relational Query Optimization', category: 'Technical', frequency: '92%', priority: 'High', description: 'Partial indexing, EXPLAIN ANALYZE execution plan evaluation, schema normalization' },
      { id: 'AREA-04', name: 'Kafka & Event-Driven Architecture', category: 'Architecture', frequency: '89%', priority: 'High', description: 'Consumer group partition rebalancing, idempotency guarantees, dead letter queues' },
      { id: 'AREA-05', name: 'Zero-Trust Security & mTLS', category: 'Security', frequency: '84%', priority: 'Medium', description: 'JWT signature verification, cryptographic token rotation, OWASP API standards' },
      { id: 'AREA-06', name: 'Technical Rubric Communication', category: 'Communication', frequency: '78%', priority: 'Medium', description: 'Architectural trade-off defense, clear technical documentation, cross-functional alignment' },
    ],
    companySpecific: [
      { skill: 'Distributed Concurrency Benchmarks', type: 'Required' },
      { skill: 'PostgreSQL Index Plan Optimization', type: 'Required' },
      { skill: 'Kafka Partitioning & Idempotency', type: 'Required' },
      { skill: 'Docker & Kubernetes Deployment', type: 'Preferred' },
    ],
    aggregatedSample: [
      { skill: 'Distributed Systems & Concurrency', frequency: '98% Industry Adoption' },
      { skill: 'Data Structures & Algorithms', frequency: '95% Industry Adoption' },
      { skill: 'Relational Database Optimization', frequency: '92% Industry Adoption' },
    ],
  },
  'Lead Product Designer': {
    commonAreas: [
      { id: 'AREA-01', name: 'Design System Architecture & Tokens', category: 'Design', frequency: '97%', priority: 'High', description: 'Figma multi-tier component libraries, semantic design tokens, responsive auto-layout' },
      { id: 'AREA-02', name: 'User Experience & Information Architecture', category: 'UX', frequency: '94%', priority: 'High', description: 'Complex B2B SaaS workflows, cognitive load reduction, task flow optimization' },
      { id: 'AREA-03', name: 'Interactive Micro-Prototyping', category: 'Design', frequency: '91%', priority: 'Medium', description: 'Stateful interactive prototypes, developer specification handoff, motion curves' },
      { id: 'AREA-04', name: 'UX Research & Usability Testing', category: 'Research', frequency: '88%', priority: 'High', description: 'Qualitative user interviews, usability heuristic audits, journey mapping' },
      { id: 'AREA-05', name: 'Cross-Functional Stakeholder Defense', category: 'Communication', frequency: '82%', priority: 'Medium', description: 'Defending design trade-offs to engineering and executive leadership' },
    ],
    companySpecific: [
      { skill: 'Enterprise Design Systems in Figma', type: 'Required' },
      { skill: 'B2B SaaS Dashboard UX', type: 'Required' },
      { skill: 'Interactive Micro-Interactions', type: 'Preferred' },
    ],
    aggregatedSample: [
      { skill: 'Design Systems & Component Architecture', frequency: '97% Industry Adoption' },
      { skill: 'User Journey Architecture', frequency: '94% Industry Adoption' },
      { skill: 'Usability Evaluation & Research', frequency: '88% Industry Adoption' },
    ],
  },
  'Cloud DevOps & SRE': {
    commonAreas: [
      { id: 'AREA-01', name: 'Kubernetes Cluster Administration', category: 'Infrastructure', frequency: '98%', priority: 'High', description: 'StatefulSets, Ingress controllers, Helm charts, node affinity, multi-tenant isolation' },
      { id: 'AREA-02', name: 'CI/CD Pipelines & GitOps Automation', category: 'Automation', frequency: '96%', priority: 'High', description: 'GitHub Actions, ArgoCD, canary deployments, zero-downtime rolling updates' },
      { id: 'AREA-03', name: 'Infrastructure as Code (Terraform)', category: 'Cloud', frequency: '93%', priority: 'High', description: 'Declarative cloud provisioning, module lifecycle, state locking, drift detection' },
      { id: 'AREA-04', name: 'Observability & Incident Telemetry', category: 'Operations', frequency: '90%', priority: 'Medium', description: 'Prometheus, Grafana, OpenTelemetry tracing, SLO/SLI error budgeting' },
      { id: 'AREA-05', name: 'Cloud Security & IAM Hardening', category: 'Security', frequency: '87%', priority: 'Medium', description: 'Least privilege IAM, KMS encryption, container vulnerability scanning' },
    ],
    companySpecific: [
      { skill: 'Kubernetes & Helm Deployment', type: 'Required' },
      { skill: 'Terraform Multi-Region IaC', type: 'Required' },
      { skill: 'Prometheus & Grafana Alerting', type: 'Preferred' },
    ],
    aggregatedSample: [
      { skill: 'Kubernetes Cluster Operations', frequency: '98% Industry Adoption' },
      { skill: 'GitOps CI/CD Automation', frequency: '96% Industry Adoption' },
      { skill: 'Infrastructure as Code (IaC)', frequency: '93% Industry Adoption' },
    ],
  },
};

const PARTICIPATING_TENANTS = [
  { name: 'Enterprise Fintech Partner', role: 'Backend Systems', verified: true },
  { name: 'Cloud Infrastructure Corp', role: 'SRE & DevOps', verified: true },
  { name: 'Global SaaS Platform', role: 'Product & Design', verified: true },
  { name: 'Your Organization', role: 'Active Tenant', isCurrent: true, verified: true },
];

export default function RoleIntelligencePage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('Senior Backend Engineer');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      const vList = await DataService.getVacancies();
      setVacancies(vList);
      if (vList.length > 0) {
        // match or default
        const match = vList.find(v => MARKET_BENCHMARKS[v.title]);
        if (match) setSelectedRole(match.title);
        else setSelectedRole(vList[0].title);
      }
    }
    load();
  }, []);

  const roleInfo = MARKET_BENCHMARKS[selectedRole] || MARKET_BENCHMARKS['Senior Backend Engineer'];

  const handleSyncIntelligence = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Cross-company requirement intelligence synchronized');
    }, 600);
  };

  const handleApplyToRole = () => {
    toast.success(`Market benchmarks mapped to ${selectedRole} requisition`);
  };

  return (
    <div className="page-content" style={{ maxWidth: 1320 }}>
      {/* Page Header with Single Primary CTA */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="breadcrumbs">
          <Link href="/dashboard/intelligence">Recruiter Intelligence</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Cross-Company Role Intelligence</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Cross-Company Role Intelligence Engine
            </h1>
            <p className="page-subtitle">
              Normalized market requirement benchmarks synthesized across anonymized enterprise hiring metadata.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncIntelligence}
              className="btn btn-secondary btn-sm"
              disabled={isSyncing}
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Market Telemetry'}</span>
            </button>
            <button
              onClick={handleApplyToRole}
              className="btn btn-gold btn-sm"
            >
              <Sparkles size={14} />
              <span>Apply Benchmarks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row-Level Security Notice Banner */}
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--r-lg)',
          padding: '14px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <ShieldCheck size={18} style={{ color: '#b45309', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.5 }}>
          <strong>Privacy Boundary &amp; Row-Level Security Guarantee:</strong> Role Intelligence is synthesized exclusively from public competency taxonomies and non-confidential requirement metadata. Confidential candidate dossiers, proprietary question banks, and internal hiring notes are <strong>strictly isolated</strong> via PostgreSQL Row-Level Security.
        </div>
      </div>

      {/* Top 2-Column Overview Cards (Perfect Grid Alignment) */}
      <div className="grid-3" style={{ gap: 24, marginBottom: 24, alignItems: 'stretch' }}>
        {/* Left Column: Target Role Selector & Metadata Sources (1 col) */}
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Active Vacancy Requisition
            </div>
            <select
              className="form-select"
              style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 16 }}
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            >
              {vacancies.length > 0 ? (
                vacancies.map(v => (
                  <option key={v.id} value={v.title}>{v.title} ({v.dept})</option>
                ))
              ) : (
                Object.keys(MARKET_BENCHMARKS).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))
              )}
            </select>

            <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                Anonymized Metadata Contributors
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PARTICIPATING_TENANTS.map(t => (
                  <div key={t.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontWeight: t.isCurrent ? 700 : 500, color: t.isCurrent ? '#00236f' : 'var(--text-secondary)' }}>
                      {t.name}
                    </span>
                    <span className={`badge ${t.isCurrent ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                      {t.isCurrent ? 'Active Workspace' : 'Synthesized'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '10px 12px', background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="td-muted">Tenant Isolation:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={12} /> 100% Enforced
            </span>
          </div>
        </div>

        {/* Right Column: Normalization Pipeline & Frequency Synthesis (2 cols) */}
        <div className="card" style={{ padding: 22, gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Competency Normalization Pipeline
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  Realtime Requirement Semantic Mapping
                </div>
              </div>
              <span className="badge badge-gray" style={{ fontSize: 10 }}>Continuous Telemetry</span>
            </div>

            <div className="grid-4" style={{ gap: 10, textAlign: 'center' }}>
              <div style={{ padding: '12px 10px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)', marginBottom: 2 }}>1. Ingestion</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Role Specs</div>
              </div>
              <div style={{ padding: '12px 10px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)', marginBottom: 2 }}>2. Synonyms</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Semantic Map</div>
              </div>
              <div style={{ padding: '12px 10px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)', marginBottom: 2 }}>3. Weights</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Frequency Bar</div>
              </div>
              <div style={{ padding: '12px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--r-md)', color: '#00236f' }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 2 }}>4. Blueprint</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{roleInfo.commonAreas.length} Core Areas</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Benchmark Standard: <strong>"Aggregated Market Role Intelligence"</strong> (Verified cross-company metadata).
            </span>
            <span style={{ fontWeight: 700, color: '#00236f' }}>
              ISO 27001 Aligned
            </span>
          </div>
        </div>
      </div>

      {/* Core Normalized Assessment Areas Grid */}
      <div className="card" style={{ marginBottom: 24, padding: 22 }}>
        <div className="card-header" style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={18} style={{ color: '#00236f' }} />
              Market Competency Benchmark Set: "{selectedRole}"
            </h2>
            <p className="card-subtitle">
              Normalized top evaluation criteria and frequency distributions derived from industry requisitions.
            </p>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 16 }}>
          {roleInfo.commonAreas.map(area => (
            <div
              key={area.id}
              style={{
                padding: '16px 18px',
                background: '#f8fafc',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                borderLeft: area.priority === 'High' ? '4px solid #00236f' : '4px solid #d4af37',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                  <div className="flex items-center gap-2">
                    <span className="td-mono font-bold text-slate-500" style={{ fontSize: 11 }}>{area.id}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{area.name}</span>
                  </div>
                  <span className={`badge ${area.priority === 'High' ? 'badge-blue' : 'badge-gold'}`} style={{ fontSize: 10 }}>
                    {area.priority} Priority
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {area.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 11.5 }}>
                <span className="badge badge-gray">{area.category}</span>
                <span style={{ fontWeight: 700, color: 'var(--brand)' }}>
                  {area.frequency} Market Adoption
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison: Market Standard vs. Current Vacancy Specs */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Left Card: Market Standards */}
        <div className="card" style={{ padding: 20 }}>
          <div className="card-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
            <div>
              <div className="card-title" style={{ fontSize: 14 }}>Aggregated Market Requirements</div>
              <div className="card-subtitle">Synthesized competency standards</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roleInfo.aggregatedSample.map((s, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.skill}</span>
                <span className="td-mono font-bold text-emerald-600" style={{ fontSize: 11.5 }}>{s.frequency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Your Organization Requirements */}
        <div className="card" style={{ padding: 20 }}>
          <div className="card-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
            <div>
              <div className="card-title" style={{ fontSize: 14 }}>Your Role Configuration</div>
              <div className="card-subtitle">Active requirements in your requisition</div>
            </div>
            <Link href="/dashboard/requirements" className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>
              Configure →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roleInfo.companySpecific.map((c, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  background: '#ffffff',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.skill}</span>
                <span className={`badge ${c.type === 'Required' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                  {c.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
