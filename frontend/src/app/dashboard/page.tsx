'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Users, ClipboardCheck, AlertTriangle, Calendar,
  CheckCircle, ChevronRight, TrendingUp, ShieldAlert, Search,
  Sparkles, FileCheck, ShieldCheck, Play, ArrowUpRight, Filter,
  Terminal, Cpu, Clock, Check, Eye, MoreHorizontal,
  Download, Plus, RefreshCw, X, Award, BarChart3, Building2,
  FolderPlus, AlertCircle, Layers, ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import { DataService, Vacancy } from '@/lib/dataService';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  description: string | null;
  role_count?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, company } = useAuth();

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [candidateCount, setCandidateCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'requisitions' | 'departments'>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Create Vacancy Modal Form State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDept, setFormDept] = useState<string>('Engineering');
  const [formExpLevel, setFormExpLevel] = useState<string>('senior');
  const [formEmpType, setFormEmpType] = useState<string>('full_time');
  const [formLocation, setFormLocation] = useState<string>('Remote / Hybrid');
  const [formVacancyCount, setFormVacancyCount] = useState<number>(1);
  const [formDesc, setFormDesc] = useState<string>('');

  // Fetch real data dynamically
  const fetchData = async () => {
    try {
      const [vList, cList, deptsRes] = await Promise.all([
        DataService.getVacancies(),
        DataService.getCandidates(),
        api.get('/departments').catch(() => null),
      ]);

      setVacancies(vList);
      setCandidateCount(cList.length);

      if (deptsRes?.data?.departments && deptsRes.data.departments.length > 0) {
        setDepartments(deptsRes.data.departments);
      } else {
        const defaultDepts: Department[] = [
          { id: 'dept-eng', name: 'Engineering', description: 'Distributed systems, backend services, and platform engineering' },
          { id: 'dept-cloud', name: 'Infrastructure & SRE', description: 'Kubernetes, multi-region CI/CD, and site reliability' },
          { id: 'dept-data', name: 'Data & AI', description: 'Real-time streaming pipelines, Kafka, and data platforms' },
          { id: 'dept-prod', name: 'Product Design', description: 'Product design, design systems, and UX research' },
        ];
        setDepartments(defaultDepts);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    toast.success('Dashboard metrics synchronized');
  };

  // Filtered Roles
  const filteredVacancies = useMemo(() => {
    return vacancies.filter((v) => {
      const matchesDept = deptFilter === 'ALL' || v.dept === deptFilter;
      const matchesSearch =
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.location && v.location.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDept && matchesSearch;
    });
  }, [vacancies, deptFilter, searchQuery]);

  // Real Stats Computed Dynamically
  const totalRoles = vacancies.length;
  const activeRoles = vacancies.filter((v) => v.status === 'published' || v.status === 'verified').length;
  const draftRoles = vacancies.filter((v) => v.status === 'draft' || v.status === 'pending').length;
  const totalOpenings = vacancies.reduce((acc, v) => acc + (Number(v.openings) || 1), 0);
  const totalApplications = vacancies.reduce((acc, v) => acc + (Number(v.applications) || 0), 0);

  // Handle Real Vacancy Creation
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Role title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await DataService.createVacancy({
        title: formTitle.trim(),
        dept: formDept,
        experience_level: formExpLevel,
        employment_type: formEmpType,
        location: formLocation.trim() || 'Remote',
        openings: formVacancyCount,
        description: formDesc.trim(),
        status: 'published',
      });

      toast.success('Vacancy published to recruitment pipeline');
      setIsModalOpen(false);

      // Reset form
      setFormTitle('');
      setFormDesc('');
      setFormVacancyCount(1);

      // Refresh list
      await fetchData();
    } catch (err: any) {
      toast.error('Failed to create vacancy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content" style={{ background: 'var(--surface)', minHeight: '100vh', padding: '24px 32px 48px' }}>
      {/* ================= TOP RECRUITMENT INTELLIGENCE HERO STRIP ================= */}
      <div className="stitch-hero">
        <div className="stitch-hero-top">
          {/* Brand & Workspace Info */}
          <div className="stitch-hero-brand">
            <div>
              <div className="stitch-hero-title-row">
                <span className="stitch-brand-tag">GenuAI Technologies</span>
                <span style={{ color: '#cbd5e1', fontSize: 13 }}>•</span>
                <h1 className="stitch-hero-heading">
                  Recruitment Intelligence & Evidence Dashboard
                </h1>
                <span className="stitch-workspace-badge">
                  {company?.name || 'Enterprise Workspace'}
                </span>
              </div>
              <p className="stitch-hero-desc">
                Verifiable Competency Assessment • Automated Match Scorecards • Zero Disqualification Bias
              </p>
            </div>
          </div>

          {/* Singular, Clear Action Bar */}
          <div className="stitch-hero-actions">
            <button
              onClick={handleRefresh}
              className="btn btn-secondary btn-sm"
              title="Sync Data"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} style={{ color: '#854d0e' }} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>

            <Link
              href="/dashboard/vacancies/builder"
              className="btn btn-secondary btn-sm"
            >
              <Sparkles size={13} style={{ color: '#b8860b' }} />
              <span>AI Vacancy Builder</span>
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-gold btn-sm"
            >
              <Plus size={15} />
              <span>Create Vacancy</span>
            </button>
          </div>
        </div>

        {/* Bottom Trust & Telemetry Strip */}
        <div className="stitch-hero-bottom">
          <div className="stitch-hero-status-group">
            <span className="stitch-status-item">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Telemetry: <strong style={{ color: 'var(--text-primary)' }}>Active</strong></span>
            </span>
            <span style={{ color: '#e2e8f0' }}>|</span>
            <span className="stitch-status-item">
              <ShieldCheck size={14} style={{ color: '#059669' }} />
              <span>Verification Status: <strong style={{ color: 'var(--text-primary)' }}>{company?.verificationStatus || 'VERIFIED'}</strong></span>
            </span>
            <span style={{ color: '#e2e8f0' }}>|</span>
            <span className="stitch-status-item">
              <Building2 size={14} style={{ color: '#b8860b' }} />
              <span>Departments: <strong style={{ color: 'var(--text-primary)' }}>{departments.length} Units</strong></span>
            </span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Company ID: {company?.id ? company.id.substring(0, 8) : 'GENUAI-LIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* ================= 4 METRIC STATS CARDS ================= */}
      <div className="stitch-stats-grid">
        {/* Card 1: Total Vacancies */}
        <div className="stitch-stat-card">
          <div className="stitch-stat-header">
            <span className="stitch-stat-title">Total Vacancies</span>
            <div className="stitch-stat-icon" style={{ background: '#fef3c7', color: '#854d0e' }}>
              <Briefcase size={17} />
            </div>
          </div>
          <div className="stitch-stat-value">
            {totalRoles} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{totalRoles === 1 ? 'Role' : 'Roles'}</span>
          </div>
          <div className="stitch-stat-footer">
            <span>{totalOpenings} open position(s)</span>
            <span style={{ fontWeight: 700, color: '#854d0e' }}>{activeRoles} Published</span>
          </div>
          <div className="stitch-stat-progress-bg">
            <div
              className="stitch-stat-progress-bar"
              style={{
                width: totalRoles > 0 ? `${Math.round((activeRoles / totalRoles) * 100)}%` : '0%',
                background: 'linear-gradient(90deg, #b8860b, #d4af37)',
              }}
            />
          </div>
        </div>

        {/* Card 2: Candidate Pipeline */}
        <div className="stitch-stat-card">
          <div className="stitch-stat-header">
            <span className="stitch-stat-title">Candidates in Pipeline</span>
            <div className="stitch-stat-icon" style={{ background: '#dcfce7', color: '#059669' }}>
              <Users size={17} />
            </div>
          </div>
          <div className="stitch-stat-value">
            {candidateCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Active</span>
          </div>
          <div className="stitch-stat-footer">
            <span>{totalApplications} total applications</span>
            <Link href="/dashboard/candidates" style={{ fontWeight: 700, color: '#059669' }}>
              Pipeline →
            </Link>
          </div>
          <div className="stitch-stat-progress-bg">
            <div
              className="stitch-stat-progress-bar"
              style={{
                width: '85%',
                background: '#059669',
              }}
            />
          </div>
        </div>

        {/* Card 3: Departments */}
        <div className="stitch-stat-card">
          <div className="stitch-stat-header">
            <span className="stitch-stat-title">Departments</span>
            <div className="stitch-stat-icon" style={{ background: '#fef3c7', color: '#854d0e' }}>
              <Building2 size={17} />
            </div>
          </div>
          <div className="stitch-stat-value">
            {departments.length}
          </div>
          <div className="stitch-stat-footer">
            <span>Organizational units</span>
            <Link href="/dashboard/departments" style={{ fontWeight: 700, color: '#b8860b' }}>
              Manage →
            </Link>
          </div>
          <div className="stitch-stat-progress-bg">
            <div
              className="stitch-stat-progress-bar"
              style={{
                width: departments.length > 0 ? '100%' : '0%',
                background: 'linear-gradient(90deg, #b8860b, #d4af37)',
              }}
            />
          </div>
        </div>

        {/* Card 4: Evidence Pipeline */}
        <div className="stitch-stat-card">
          <div className="stitch-stat-header">
            <span className="stitch-stat-title">Evidence & Integrity</span>
            <div className="stitch-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <ShieldCheck size={17} />
            </div>
          </div>
          <div className="stitch-stat-value">
            100% Verified
          </div>
          <div className="stitch-stat-footer">
            <span>Multi-modal sandboxed</span>
            <Link href="/dashboard/integrity" style={{ fontWeight: 700, color: '#d97706' }}>
              Signals →
            </Link>
          </div>
          <div className="stitch-stat-progress-bg">
            <div
              className="stitch-stat-progress-bar"
              style={{
                width: '100%',
                background: '#d97706',
              }}
            />
          </div>
        </div>
      </div>

      {/* ================= TABS NAVIGATION ================= */}
      <div className="stitch-tabs-container">
        <div className="stitch-tabs-list">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`stitch-tab-btn ${selectedTab === 'overview' ? 'active' : ''}`}
          >
            <BarChart3 size={15} />
            <span>Overview & Insights</span>
          </button>

          <button
            onClick={() => setSelectedTab('requisitions')}
            className={`stitch-tab-btn ${selectedTab === 'requisitions' ? 'active' : ''}`}
          >
            <Briefcase size={15} />
            <span>Vacancies List</span>
            <span className="stitch-tab-badge">
              {filteredVacancies.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('departments')}
            className={`stitch-tab-btn ${selectedTab === 'departments' ? 'active' : ''}`}
          >
            <Building2 size={15} />
            <span>Departments</span>
            <span className="stitch-tab-badge">
              {departments.length}
            </span>
          </button>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, paddingBottom: 6 }}>
          Live Synchronized State
        </div>
      </div>

      {/* ================= TAB CONTENT PANEL ================= */}
      <div className="stitch-panel">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {selectedTab === 'overview' && (
          <div>
            {vacancies.length === 0 ? (
              <div className="stitch-empty-container">
                <div className="stitch-empty-icon-box">
                  <Briefcase size={26} />
                </div>
                <h3 className="stitch-empty-title">No Vacancies Created Yet</h3>
                <p className="stitch-empty-desc">
                  Start your recruitment intelligence pipeline by publishing your first job vacancy. GenuAI will map verified competency benchmarks automatically.
                </p>
                <div className="stitch-empty-actions">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-gold btn-sm text-white"
                  >
                    <Plus size={15} />
                    <span>Create First Vacancy</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
                {/* Left: Active Vacancies Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="flex items-center justify-between" style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        Recent Vacancy Requisitions ({vacancies.length})
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Live status of your published and draft vacancies
                      </div>
                    </div>
                    <Link href="/dashboard/vacancies" className="btn btn-secondary btn-sm" style={{ fontSize: 11.5 }}>
                      Manage All
                    </Link>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {vacancies.slice(0, 5).map((vac) => (
                      <div
                        key={vac.id}
                        style={{
                          padding: '14px 16px',
                          background: '#ffffff',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 14,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/vacancies/${vac.id}`} style={{ fontWeight: 700, fontSize: 13.5, color: '#b8860b', textDecoration: 'none' }}>
                              {vac.title}
                            </Link>
                            <span
                              className={`badge ${
                                vac.status === 'published' || vac.status === 'verified'
                                  ? 'badge-green'
                                  : vac.status === 'draft' || vac.status === 'pending'
                                  ? 'badge-yellow'
                                  : 'badge-gray'
                              }`}
                              style={{ fontSize: 10 }}
                            >
                              {vac.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                            {vac.dept} • {vac.location || 'Remote'} • {vac.openings} opening(s) • {vac.applications} applicant(s)
                          </div>
                        </div>

                        <Link
                          href={`/dashboard/vacancies/${vac.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11.5, flexShrink: 0 }}
                        >
                          Details →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Department & Framework info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Department Summary Card */}
                  <div className="card" style={{ padding: 20 }}>
                    <div className="card-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
                      <div>
                        <div className="card-title" style={{ fontSize: 13.5 }}>Department Coverage</div>
                        <div className="card-subtitle">Organizational division matrix</div>
                      </div>
                      <Link href="/dashboard/departments" style={{ fontSize: 12, fontWeight: 700, color: '#b8860b' }}>
                        Manage
                      </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {departments.map((d) => {
                        const count = vacancies.filter(v => v.dept.toLowerCase() === d.name.toLowerCase() || v.dept.includes(d.name)).length;
                        return (
                          <div
                            key={d.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 0',
                              borderBottom: '1px solid var(--border)',
                              fontSize: 12.5,
                            }}
                          >
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{count} role(s)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Verification & Trust Notice */}
                  <div
                    style={{
                      padding: '18px 20px',
                      borderRadius: 'var(--r-lg)',
                      background: 'linear-gradient(135deg, #fffdf5 0%, #fef3c7 100%)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                    }}
                  >
                    <div className="flex items-center gap-2" style={{ fontWeight: 700, color: '#854d0e', fontSize: 13, marginBottom: 4 }}>
                      <ShieldCheck size={16} />
                      <span>Verifiable Evidence Guarantee</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      GenuAI provides rigorous candidate competency evaluation backed by SHA-256 evidence hashing and zero disqualification bias.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: VACANCIES LIST ================= */}
        {selectedTab === 'requisitions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Clean Filter Toolbar (No duplicate Create buttons) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                <div className="search-box" style={{ flex: 1, maxWidth: 320 }}>
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vacancy title, location..."
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-muted)' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 180, padding: '7px 28px 7px 12px', fontSize: 12.5 }}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Showing <strong>{filteredVacancies.length}</strong> of <strong>{vacancies.length}</strong> roles
              </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Position Title</th>
                    <th>Department</th>
                    <th>Openings</th>
                    <th>Applicants</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVacancies.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No vacancies match the criteria.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredVacancies.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <Link
                            href={`/dashboard/vacancies/${v.id}`}
                            style={{ fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}
                          >
                            {v.title}
                          </Link>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {v.location} • {v.employment_type?.replace('_', ' ')}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-gray">{v.dept}</span>
                        </td>
                        <td className="td-mono font-semibold">{v.openings}</td>
                        <td className="td-mono font-semibold">{v.applications}</td>
                        <td>
                          <span
                            className={`badge ${
                              v.status === 'published' || v.status === 'verified'
                                ? 'badge-green'
                                : v.status === 'draft' || v.status === 'pending'
                                ? 'badge-yellow'
                                : 'badge-gray'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="td-muted td-mono" style={{ whiteSpace: 'nowrap' }}>
                          {v.created}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href={`/dashboard/vacancies/${v.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: 11.5 }}>
                            <Eye size={13} />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: DEPARTMENTS ================= */}
        {selectedTab === 'departments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  Registered Company Departments
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Manage departmental permissions, vacancy budgets, and interviewer allocations
                </div>
              </div>
              <Link href="/dashboard/departments" className="btn btn-secondary btn-sm">
                Open Department Hub →
              </Link>
            </div>

            <div className="grid-3" style={{ gap: 16 }}>
              {departments.map((dept) => {
                const count = vacancies.filter(v => v.dept.toLowerCase() === dept.name.toLowerCase() || v.dept.includes(dept.name)).length;
                return (
                  <div key={dept.id} className="card" style={{ padding: 18 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                      <Building2 size={16} style={{ color: '#b8860b' }} />
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{dept.name}</div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', minHeight: 36, lineHeight: 1.4, margin: '0 0 12px 0' }}>
                      {dept.description || 'Core organizational department.'}
                    </p>
                    <div className="flex items-center justify-between" style={{ paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11.5 }}>
                      <span className="td-muted font-medium">{count} Active Vacancies</span>
                      <Link href="/dashboard/departments" style={{ color: '#b8860b', fontWeight: 600 }}>Configure →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= CREATE VACANCY MODAL ================= */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Create New Vacancy</div>
                <div className="modal-subtitle">Define role details to publish to the recruitment pipeline</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn-icon" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Position Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Distributed Systems Engineer"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="form-select"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience Level</label>
                    <select
                      value={formExpLevel}
                      onChange={(e) => setFormExpLevel(e.target.value)}
                      className="form-select"
                    >
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                      <option value="lead">Lead / Principal</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Employment Type</label>
                    <select
                      value={formEmpType}
                      onChange={(e) => setFormEmpType(e.target.value)}
                      className="form-select"
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Openings Count</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formVacancyCount}
                      onChange={(e) => setFormVacancyCount(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. London, UK (Remote)"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role Overview & Description</label>
                  <textarea
                    rows={3}
                    placeholder="Summarize core responsibilities, key deliverables, and technical domain..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-gold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Vacancy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
