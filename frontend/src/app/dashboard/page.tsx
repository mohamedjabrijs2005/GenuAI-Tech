'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Users, ShieldCheck, Search,
  Sparkles, FileCheck, Plus, RefreshCw, X, BarChart3, Building2, Eye
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
  const [formDept, setFormDept] = useState<string>('');
  const [formExpLevel, setFormExpLevel] = useState<string>('senior');
  const [formEmpType, setFormEmpType] = useState<string>('full_time');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formVacancyCount, setFormVacancyCount] = useState<number>(1);
  const [formDesc, setFormDesc] = useState<string>('');
  const [formDeptId, setFormDeptId] = useState<string>('');

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
        setFormDeptId(deptsRes.data.departments[0]?.id || '');
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
      const selectedDept = departments.find(d => d.id === formDeptId);
      await DataService.createVacancy({
        title: formTitle.trim(),
        dept: selectedDept?.name || 'Engineering',
        department_id: formDeptId || undefined,
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
      {/* ================= TOP RECRUITMENT INTELLIGENCE HERO BANNER ================= */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        padding: '28px 32px',
        marginBottom: 0,
        border: '1px solid rgba(212,175,55,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Decorative background circles */}
        <div style={{ position: 'absolute', top: -60, right: 60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 200, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,150,105,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 1 }}>
          {/* Left: Brand & Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: '99px',
                background: 'rgba(212,175,55,0.18)', color: '#d4af37',
                border: '1px solid rgba(212,175,55,0.35)',
              }}>
                GenuAI Technologies
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>•</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                padding: '3px 10px', borderRadius: '99px',
                background: 'rgba(5,150,105,0.15)', color: '#34d399',
                border: '1px solid rgba(5,150,105,0.3)',
              }}>
                {company?.name || 'Enterprise Workspace'}
              </span>
            </div>

            <h1 style={{
              fontSize: 22, fontWeight: 900, color: '#f8fafc',
              letterSpacing: '-0.5px', margin: '0 0 6px',
              lineHeight: 1.2,
            }}>
              Recruitment Intelligence
              <span style={{ color: '#d4af37' }}> & </span>
              Evidence Dashboard
            </h1>

            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', margin: '0 0 18px', lineHeight: 1.5 }}>
              Verifiable Competency Assessment&nbsp;•&nbsp;Automated Match Scorecards&nbsp;•&nbsp;Zero Disqualification Bias
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleRefresh}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                title="Sync Data"
              >
                <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Syncing...' : 'Sync'}
              </button>

              <Link
                href="/dashboard/vacancies/builder"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, textDecoration: 'none',
                  background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
                  color: '#d4af37', fontSize: 12, fontWeight: 600,
                }}
              >
                <Sparkles size={12} />
                AI Vacancy Builder
              </Link>

              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
                  background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                  border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(212,175,55,0.35)',
                }}
              >
                <Plus size={14} />
                Create Vacancy
              </button>
            </div>
          </div>

          {/* Right: SVG Intelligence Visual */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            {/* Decorative Intelligence Node Graph */}
            <svg width="220" height="130" viewBox="0 0 220 130" fill="none" style={{ opacity: 0.85 }}>
              {/* Connecting lines */}
              <line x1="110" y1="65" x2="50" y2="30" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="110" y1="65" x2="170" y2="30" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="110" y1="65" x2="30" y2="100" stroke="rgba(5,150,105,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="110" y1="65" x2="190" y2="100" stroke="rgba(5,150,105,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="110" y1="65" x2="110" y2="10" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              {/* Center Node */}
              <circle cx="110" cy="65" r="18" fill="rgba(212,175,55,0.15)" stroke="#d4af37" strokeWidth="2" />
              <circle cx="110" cy="65" r="10" fill="rgba(212,175,55,0.3)" />
              <text x="110" y="69" textAnchor="middle" fill="#d4af37" fontSize="9" fontWeight="700">AI</text>
              {/* Satellite Nodes */}
              <circle cx="50" cy="30" r="12" fill="rgba(99,102,241,0.15)" stroke="#818cf8" strokeWidth="1.5" />
              <text x="50" y="34" textAnchor="middle" fill="#818cf8" fontSize="7" fontWeight="600">TARGET</text>
              <circle cx="170" cy="30" r="12" fill="rgba(5,150,105,0.15)" stroke="#34d399" strokeWidth="1.5" />
              <text x="170" y="34" textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="600">PROVE</text>
              <circle cx="30" cy="100" r="12" fill="rgba(212,175,55,0.1)" stroke="#d4af37" strokeWidth="1.5" />
              <text x="30" y="104" textAnchor="middle" fill="#d4af37" fontSize="7" fontWeight="600">LEARN</text>
              <circle cx="190" cy="100" r="12" fill="rgba(239,68,68,0.1)" stroke="#f87171" strokeWidth="1.5" />
              <text x="190" y="104" textAnchor="middle" fill="#f87171" fontSize="7" fontWeight="600">ASSESS</text>
              <circle cx="110" cy="10" r="10" fill="rgba(99,102,241,0.15)" stroke="#818cf8" strokeWidth="1.5" />
              <text x="110" y="13.5" textAnchor="middle" fill="#818cf8" fontSize="6.5" fontWeight="600">EVIDENCE</text>
              {/* Pulse ring */}
              <circle cx="110" cy="65" r="26" stroke="rgba(212,175,55,0.2)" strokeWidth="1" fill="none" />
              <circle cx="110" cy="65" r="34" stroke="rgba(212,175,55,0.08)" strokeWidth="1" fill="none" />
            </svg>

            {/* Bottom status strip */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 6px #34d399' }} />
                Telemetry: <strong style={{ color: '#34d399' }}>Active</strong>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <ShieldCheck size={11} style={{ color: '#34d399' }} />
                <strong style={{ color: '#34d399' }}>{company?.verificationStatus || 'VERIFIED'}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                <Building2 size={11} style={{ color: '#d4af37' }} />
                <span>{departments.length} Dept{departments.length !== 1 ? 's' : ''}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <span style={{ fontFamily: 'monospace', fontSize: 10 }}>
                  ID: {company?.id ? company.id.substring(0, 8).toUpperCase() : 'GENUAI'}
                </span>
              </div>
            </div>
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
                width: candidateCount > 0 ? `${Math.min(100, Math.round((candidateCount / Math.max(totalApplications, 1)) * 100))}%` : '0%',
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

        {/* Card 4: Evidence & Integrity */}
        <div className="stitch-stat-card">
          <div className="stitch-stat-header">
            <span className="stitch-stat-title">Evidence & Integrity</span>
            <div className="stitch-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <ShieldCheck size={17} />
            </div>
          </div>
          <div className="stitch-stat-value">
            {candidateCount > 0 ? `${candidateCount} Tracked` : 'No Data'}
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
                width: candidateCount > 0 ? '100%' : '0%',
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
                      value={formDeptId}
                      onChange={(e) => setFormDeptId(e.target.value)}
                      className="form-select"
                    >
                      {departments.length === 0 && (
                        <option value="">No departments available</option>
                      )}
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
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
