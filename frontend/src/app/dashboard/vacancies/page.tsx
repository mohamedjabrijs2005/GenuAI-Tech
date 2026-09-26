'use client';

import { useState } from 'react';
import { Plus, Search, Briefcase, Users, ClipboardCheck, Calendar, MoreHorizontal, Eye, Sparkles } from 'lucide-react';

const VACANCIES = [
  { id: 1, title: 'Software Developer', dept: 'Engineering', openings: 3, applications: 45, assessments: 31, interviews: 8, status: 'published', created: '2026-09-10' },
  { id: 2, title: 'Product Designer', dept: 'Design', openings: 2, applications: 28, assessments: 12, interviews: 3, status: 'published', created: '2026-09-14' },
  { id: 3, title: 'Data Analyst', dept: 'Analytics', openings: 1, applications: 19, assessments: 0, interviews: 0, status: 'pending', created: '2026-09-18' },
  { id: 4, title: 'DevOps Engineer', dept: 'Infrastructure', openings: 2, applications: 34, assessments: 21, interviews: 7, status: 'paused', created: '2026-09-05' },
  { id: 5, title: 'Sales Manager', dept: 'Sales', openings: 1, applications: 0, assessments: 0, interviews: 0, status: 'draft', created: '2026-09-24' },
  { id: 6, title: 'QA Engineer', dept: 'Engineering', openings: 1, applications: 12, assessments: 5, interviews: 2, status: 'published', created: '2026-09-20' },
];

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-draft',
  pending: 'badge-pending',
  verified: 'badge-verified',
  published: 'badge-published',
  paused: 'badge-paused',
  closed: 'badge-closed',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending Verification',
  verified: 'Verified',
  published: 'Published',
  paused: 'Paused',
  closed: 'Closed',
};

export default function VacanciesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = VACANCIES.filter((v) => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.dept.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || v.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Recruitment</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Vacancies</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title flex items-center gap-3">
              Vacancies & Open Roles
              <span className="gold-badge">
                <Sparkles size={12} />
                Active Hiring Pipeline
              </span>
            </h1>
            <p className="page-subtitle">Define, verify, and publish role requirements for GenuAI Technologies.</p>
          </div>
          <button className="btn btn-gold">
            <Plus size={16} />
            Create Vacancy
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Roles', value: VACANCIES.length, color: 'var(--text-primary)', cardClass: 'stat-card-gold' },
          { label: 'Published & Active', value: VACANCIES.filter(v => v.status === 'published').length, color: 'var(--success)', cardClass: 'stat-card-success' },
          { label: 'Pending Verification', value: VACANCIES.filter(v => v.status === 'pending').length, color: 'var(--warning)', cardClass: 'stat-card-warning' },
          { label: 'Draft Roles', value: VACANCIES.filter(v => v.status === 'draft').length, color: 'var(--text-muted)', cardClass: 'stat-card-brand' },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.cardClass}`} style={{ padding: '16px 20px' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 26 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            placeholder="Search positions or departments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search vacancies"
          />
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {['all', 'published', 'pending', 'draft', 'paused', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-gold' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {s === 'all' ? 'All Roles' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Department</th>
              <th>Openings</th>
              <th><span className="flex items-center gap-1"><Users size={12} />Applicants</span></th>
              <th><span className="flex items-center gap-1"><ClipboardCheck size={12} />Assessed</span></th>
              <th><span className="flex items-center gap-1"><Calendar size={12} />Interviews</span></th>
              <th>Status</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-icon"><Briefcase size={22} /></div>
                    <div className="empty-title">No vacancies found</div>
                    <div className="empty-desc">Try changing your search filter or create a new vacancy.</div>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((v) => (
              <tr key={v.id}>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{v.title}</div>
                </td>
                <td className="td-muted font-medium">{v.dept}</td>
                <td className="td-muted td-mono font-semibold">{v.openings}</td>
                <td className="td-mono font-semibold">{v.applications}</td>
                <td className="td-mono font-semibold text-emerald-600">{v.assessments}</td>
                <td className="td-mono font-semibold">{v.interviews}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[v.status] || 'badge-gray'}`}>
                    {STATUS_LABEL[v.status] || v.status}
                  </span>
                </td>
                <td className="td-muted td-mono" style={{ whiteSpace: 'nowrap' }}>
                  {v.created}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="flex justify-end gap-2">
                    <button className="btn btn-ghost btn-sm btn-icon" title="View Vacancy Details" aria-label={`View ${v.title}`}>
                      <Eye size={15} />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-icon" title="More Actions" aria-label="More options">
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
