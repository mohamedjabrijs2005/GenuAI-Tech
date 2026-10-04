'use client';

import { useState, useEffect, Fragment } from 'react';
import {
  Shield, Search, Filter, Clock, User, Briefcase, Users,
  FileText, ClipboardList, AlertTriangle, Calendar, ChevronDown,
  Eye, Download, RefreshCw, CheckCircle2, Info, Building2
} from 'lucide-react';
import api from '@/lib/api';

const MOCK_LOGS = [
  { id: '1', created_at: '2026-10-01T17:23:14Z', actor_name: 'Mohamed Jabri', actor_email: 'admin@company.io', entity_type: 'vacancy', entity_id: 'vac-001', action: 'submitted_for_verification', details: { title: 'Senior Software Developer' } },
  { id: '2', created_at: '2026-10-01T15:10:02Z', actor_name: 'Mohamed Jabri', actor_email: 'admin@company.io', entity_type: 'application', entity_id: 'app-021', action: 'decision_made', details: { decision: 'Selected', candidate: 'James Okonkwo' } },
  { id: '3', created_at: '2026-10-01T14:45:00Z', actor_name: 'Sara Chen', actor_email: 'recruiter@company.io', entity_type: 'interview', entity_id: 'int-009', action: 'feedback_submitted', details: { status: 'Completed', score: 9.2 } },
  { id: '4', created_at: '2026-10-01T13:22:30Z', actor_name: 'Mohamed Jabri', actor_email: 'admin@company.io', entity_type: 'vacancy', entity_id: 'vac-002', action: 'created', details: { title: 'Product Designer' } },
  { id: '5', created_at: '2026-10-01T11:58:00Z', actor_name: 'Sara Chen', actor_email: 'recruiter@company.io', entity_type: 'application', entity_id: 'app-018', action: 'status_changed', details: { status: 'Interview', candidate: 'Alex Rivera' } },
  { id: '6', created_at: '2026-09-30T16:30:00Z', actor_name: 'GenuAI Admin', actor_email: 'admin@genuai.io', entity_type: 'company', entity_id: 'cmp-001', action: 'verified', details: { status: 'VERIFIED' } },
  { id: '7', created_at: '2026-09-30T14:00:00Z', actor_name: 'Mohamed Jabri', actor_email: 'admin@company.io', entity_type: 'agreement', entity_id: 'agr-001', action: 'accepted', details: { type: 'Assessment Sharing Agreement' } },
  { id: '8', created_at: '2026-09-30T10:15:00Z', actor_name: 'Kenji Watanabe', actor_email: 'interviewer@company.io', entity_type: 'interview', entity_id: 'int-007', action: 'feedback_submitted', details: { status: 'Completed', score: 7.8 } },
  { id: '9', created_at: '2026-09-29T17:45:00Z', actor_name: 'Sara Chen', actor_email: 'recruiter@company.io', entity_type: 'application', entity_id: 'app-015', action: 'decision_made', details: { decision: 'Rejected', candidate: 'B. Kumar' } },
  { id: '10', created_at: '2026-09-29T09:30:00Z', actor_name: 'Mohamed Jabri', actor_email: 'admin@company.io', entity_type: 'vacancy', entity_id: 'vac-001', action: 'updated', details: { field: 'closing_date' } },
];

const ENTITY_ICON: Record<string, React.ReactNode> = {
  vacancy: <Briefcase size={14} />,
  application: <Users size={14} />,
  interview: <Calendar size={14} />,
  company: <Building2 size={14} />,
  agreement: <FileText size={14} />,
  integrity_signal: <AlertTriangle size={14} />,
};

const ACTION_BADGE: Record<string, { label: string; cls: string }> = {
  created: { label: 'Created', cls: 'badge-blue' },
  updated: { label: 'Updated', cls: 'badge-gray' },
  submitted_for_verification: { label: 'Submitted', cls: 'badge-pending' },
  verified: { label: 'Verified', cls: 'badge-published' },
  status_changed: { label: 'Stage Changed', cls: 'badge-yellow' },
  decision_made: { label: 'Decision Made', cls: 'badge-green' },
  feedback_submitted: { label: 'Feedback', cls: 'badge-indigo' },
  accepted: { label: 'Accepted', cls: 'badge-published' },
  deleted: { label: 'Deleted', cls: 'badge-red' },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api.get('/reports/audit')
      .then(r => { if (r.data.logs?.length) setLogs(r.data.logs); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = logs.filter(log => {
    const matchSearch = log.actor_name.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    return matchSearch && matchEntity;
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Platform</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Audit Trail</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Audit Trail</h1>
            <p className="page-subtitle">Immutable log of all actions taken within your company workspace. Every change is recorded for compliance and accountability.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setIsLoading(true)}>
              <RefreshCw size={14} />
            </button>
            <button className="btn btn-gold">
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Events', value: logs.length, icon: <Shield size={18} />, cls: 'stat-card-gold' },
          { label: 'Today', value: logs.filter(l => l.created_at.startsWith('2026-10-01')).length, icon: <Clock size={18} />, cls: 'stat-card-brand' },
          { label: 'Unique Actors', value: [...new Set(logs.map(l => l.actor_email))].length, icon: <User size={18} />, cls: 'stat-card-success' },
          { label: 'Entity Types', value: [...new Set(logs.map(l => l.entity_type))].length, icon: <ClipboardList size={18} />, cls: 'stat-card-warning' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search actor, action, entity..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search audit logs"
          />
        </div>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="form-select" style={{ width: 'auto' }}>
          <option value="all">All Entities</option>
          <option value="vacancy">Vacancy</option>
          <option value="application">Application</option>
          <option value="interview">Interview</option>
          <option value="company">Company</option>
          <option value="agreement">Agreement</option>
        </select>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', alignSelf: 'center' }}>
          <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
          Immutable — read only
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Details</th>
              <th style={{ textAlign: 'right' }}>Expand</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon"><Shield size={22} /></div>
                    <div className="empty-title">No audit events found</div>
                    <div className="empty-desc">Try adjusting your search or filters.</div>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map(log => {
              const badge = ACTION_BADGE[log.action] || { label: log.action, cls: 'badge-gray' };
              const expanded = expandedId === log.id;
              return (
                <Fragment key={log.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expanded ? null : log.id)}>
                    <td className="td-mono" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{formatTime(log.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, flexShrink: 0
                        }}>
                          {getInitials(log.actor_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{log.actor_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.actor_email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: 'var(--text-muted)' }}>{ENTITY_ICON[log.entity_type] || <Info size={14} />}</span>
                        <span style={{ fontWeight: 600, fontSize: 12, textTransform: 'capitalize' }}>{log.entity_type}</span>
                      </div>
                    </td>
                    <td className="td-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {log.entity_id?.slice(0, 12)}…
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </td>
                  </tr>
                  {expanded && (
                    <tr style={{ background: 'var(--surface-container-low)' }}>
                      <td colSpan={7} style={{ padding: '12px 20px' }}>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', background: 'var(--surface-container)', padding: '10px 14px', borderRadius: 8, color: 'var(--text-primary)' }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify({ id: log.id, actor: log.actor_name, email: log.actor_email, entity: log.entity_type, entity_id: log.entity_id, action: log.action, details: log.details, timestamp: log.created_at }, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GDPR Note */}
      <div className="card" style={{ marginTop: 16, padding: '12px 18px', background: 'var(--info-bg)', border: '1px solid rgba(2,132,199,0.3)', borderRadius: 10 }}>
        <div className="flex items-center gap-3" style={{ fontSize: 13, color: '#0369a1' }}>
          <Shield size={16} />
          <span>
            <strong>Compliance Note:</strong> This audit trail is immutable and stored for 5 years in line with GDPR Article 30 (Records of Processing) and your company&apos;s data retention policy.
            Audit logs cannot be deleted or modified. Contact your GenuAI Admin for export requests.
          </span>
        </div>
      </div>
    </div>
  );
}
