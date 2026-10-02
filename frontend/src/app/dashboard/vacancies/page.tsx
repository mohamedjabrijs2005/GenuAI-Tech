'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Briefcase, Users, ClipboardCheck, Calendar, MoreHorizontal, Eye, Sparkles, Copy, Pause, Play, Trash2, X } from 'lucide-react';
import { DataService, Vacancy } from '@/lib/dataService';
import toast from 'react-hot-toast';

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
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const loadVacancies = async () => {
    try {
      const data = await DataService.getVacancies();
      setVacancies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVacancies();
  }, []);

  const handleTogglePause = async (v: Vacancy) => {
    const nextStatus = v.status === 'paused' ? 'published' : 'paused';
    await DataService.updateVacancyStatus(v.id, nextStatus);
    toast.success(`Vacancy is now ${nextStatus}`);
    await loadVacancies();
  };

  const handleDuplicate = async (v: Vacancy) => {
    await DataService.createVacancy({
      title: `${v.title} (Copy)`,
      dept: v.dept,
      openings: v.openings,
      location: v.location,
      experience_level: v.experience_level,
      employment_type: v.employment_type,
      description: v.description,
      status: 'draft',
    });
    toast.success('Vacancy duplicated as draft');
    await loadVacancies();
  };

  const filtered = vacancies.filter((v) => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.dept.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || v.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-content">
      {/* Page Header with Single Primary CTA */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Recruitment</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Vacancies</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Vacancies &amp; Open Roles
            </h1>
            <p className="page-subtitle">Define, verify, and publish role requirements for GenuAI Technologies.</p>
          </div>
          <Link href="/dashboard/vacancies/builder" className="btn btn-gold">
            <Plus size={16} />
            Create Vacancy
          </Link>
        </div>
      </div>

      {/* Stats row dynamically calculated */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Roles', value: vacancies.length, color: 'var(--text-primary)', cardClass: 'stat-card-gold' },
          { label: 'Published & Active', value: vacancies.filter(v => v.status === 'published' || v.status === 'verified').length, color: 'var(--success)', cardClass: 'stat-card-success' },
          { label: 'Pending / Draft', value: vacancies.filter(v => v.status === 'pending' || v.status === 'draft').length, color: 'var(--warning)', cardClass: 'stat-card-warning' },
          { label: 'Total Openings', value: vacancies.reduce((a, v) => a + (v.openings || 1), 0), color: 'var(--text-muted)', cardClass: 'stat-card-brand' },
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
              {s === 'all' ? 'All Roles' : STATUS_LABEL[s] || s}
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
                  <Link href={`/dashboard/vacancies/${v.id}`} style={{ fontWeight: 700, color: 'var(--brand-light)', fontSize: 14, textDecoration: 'none' }}>
                    {v.title}
                  </Link>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {v.location || 'Remote'}
                  </div>
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
                  <div className="flex justify-end gap-1.5">
                    <Link href={`/dashboard/vacancies/${v.id}`} className="btn btn-secondary btn-sm" title="View Vacancy Details">
                      <Eye size={14} />
                      <span>Details</span>
                    </Link>
                    <button
                      onClick={() => handleTogglePause(v)}
                      className="btn btn-ghost btn-sm btn-icon"
                      title={v.status === 'paused' ? 'Resume Vacancy' : 'Pause Vacancy'}
                    >
                      {v.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      onClick={() => handleDuplicate(v)}
                      className="btn btn-ghost btn-sm btn-icon"
                      title="Duplicate"
                    >
                      <Copy size={14} />
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
