'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Users, FileCheck, Calendar, Plus, RefreshCw,
  Search, X, ExternalLink, CheckCircle2, AlertCircle, Building2,
  Clock, ArrowRight, ShieldCheck, ChevronRight
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

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_name?: string;
  actor_role?: string;
  old_status?: string;
  new_status?: string;
  reason?: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, company, refreshAuth } = useAuth();

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [candidateCount, setCandidateCount] = useState<number>(0);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('just now');

  // Filters for Vacancy Table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Fetch real data dynamically from PostgreSQL
  const fetchData = async () => {
    try {
      const [vList, cList, deptsRes, actList] = await Promise.all([
        DataService.getVacancies(),
        DataService.getCandidates(),
        api.get('/departments').catch(() => null),
        DataService.getActivity().catch(() => []),
      ]);

      setVacancies(vList);
      setCandidateCount(cList.length);
      setActivities(actList || []);

      if (deptsRes?.data?.departments && deptsRes.data.departments.length > 0) {
        setDepartments(deptsRes.data.departments);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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
    await Promise.all([
      refreshAuth(),
      fetchData(),
    ]);
    toast.success('Workspace synchronized with database');
  };

  // Dynamic Greeting based on current local time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = user?.firstName || 'Recruiter';
  const companyName = company?.name || 'Company Workspace';
  const companyStatus = company?.verificationStatus || 'PENDING_VERIFICATION';

  // Real operational counts computed from real database records
  const publishedCount = vacancies.filter(v => v.raw_status === 'PUBLISHED' || v.status === 'published').length;
  const pendingReviewCount = vacancies.filter(v => v.raw_status === 'PENDING_ADMIN_REVIEW' || v.status === 'pending').length;
  const changesRequestedCount = vacancies.filter(v => v.raw_status === 'CHANGES_REQUESTED' || v.status === 'changes_requested').length;
  const draftCount = vacancies.filter(v => v.raw_status === 'DRAFT' || v.status === 'draft').length;

  // Filtered Vacancies for the table
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

  // Action required items
  const actionItems = useMemo(() => {
    const items: { id: string; title: string; desc: string; link: string; type: 'warning' | 'info' }[] = [];

    if (changesRequestedCount > 0) {
      items.push({
        id: 'changes_req',
        title: `${changesRequestedCount} vacancy requisition requires changes`,
        desc: 'Administrative review requested updates to requirements or role specifications before approval.',
        link: '/dashboard/vacancies',
        type: 'warning',
      });
    }

    if (draftCount > 0) {
      items.push({
        id: 'drafts',
        title: `${draftCount} draft vacancy ready for submission`,
        desc: 'Review requirements and submit to platform verification for publication.',
        link: '/dashboard/vacancies',
        type: 'info',
      });
    }

    return items;
  }, [changesRequestedCount, draftCount]);

  // Helper for Status Badge styling
  const renderStatusBadge = (statusStr: string, rawStatus?: string) => {
    const norm = (rawStatus || statusStr || '').toUpperCase();
    if (norm === 'PUBLISHED') {
      return <span className="badge badge-green">Published</span>;
    }
    if (norm === 'APPROVED') {
      return <span className="badge badge-green">Approved</span>;
    }
    if (norm === 'PENDING_ADMIN_REVIEW' || norm === 'PENDING') {
      return <span className="badge badge-yellow">Pending Review</span>;
    }
    if (norm === 'CHANGES_REQUESTED') {
      return <span className="badge badge-yellow">Changes Requested</span>;
    }
    if (norm === 'DRAFT') {
      return <span className="badge badge-gray">Draft</span>;
    }
    if (norm === 'CLOSED') {
      return <span className="badge badge-gray">Closed</span>;
    }
    return <span className="badge badge-gray">{statusStr}</span>;
  };

  // Helper for Company Verification Badge with Fixed Alignment
  const renderCompanyStatusBadge = () => {
    const s = companyStatus.toUpperCase();
    if (s === 'APPROVED' || s === 'VERIFIED') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: '999px', fontSize: 12, fontWeight: 700,
          background: 'rgba(5, 150, 105, 0.1)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.25)',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <ShieldCheck size={14} style={{ color: '#059669' }} />
          Verified & Approved
        </span>
      );
    }
    if (s === 'UNDER_REVIEW') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: '999px', fontSize: 12, fontWeight: 700,
          background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.25)',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
          Under Admin Review
        </span>
      );
    }
    if (s === 'ADDITIONAL_INFORMATION_REQUIRED' || s === 'CHANGES_REQUESTED') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: '999px', fontSize: 12, fontWeight: 700,
          background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.25)',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <AlertCircle size={14} style={{ color: '#d97706' }} />
          Action Required
        </span>
      );
    }
    if (s === 'REJECTED' || s === 'SUSPENDED') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: '999px', fontSize: 12, fontWeight: 700,
          background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.25)',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
          {s === 'SUSPENDED' ? 'Suspended' : 'Rejected'}
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 12px', borderRadius: '999px', fontSize: 12, fontWeight: 700,
        background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.25)',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        <Clock size={14} style={{ color: '#d97706' }} />
        Pending Verification
      </span>
    );
  };

  return (
    <div className="page-content" style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      
      {/* ================= 1. RECRUITER WORKSPACE HEADER ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        {/* Left: Operational Greeting & Workspace Details */}
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.4px', margin: '0 0 6px',
          }}>
            {greeting}, {userName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            <span>Company workspace: <strong style={{ color: 'var(--text-primary)' }}>{companyName}</strong></span>
          </div>
        </div>

        {/* Right: Operational Status Strip (No running clock, truthful synchronization) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span style={{ fontWeight: 600, color: '#059669' }}>Connected</span>
            <span style={{ color: 'var(--border)' }}>&middot;</span>
            <span>Last synchronized: {lastSyncTime}</span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center',
              }}
              title="Synchronize data"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            {renderCompanyStatusBadge()}
          </div>
        </div>
      </div>

      {/* ================= 2. ACTION REQUIRED SECTION ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Action Required</span>
            {actionItems.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
                background: '#fef3c7', color: '#b45309',
              }}>
                {actionItems.length}
              </span>
            )}
          </div>
        </div>

        {actionItems.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', background: '#f8fafc', borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}>
            <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>No action required right now.</strong> All active vacancies are compliant with platform review criteria and applicant queues are up to date.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actionItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '12px 16px',
                  background: item.type === 'warning' ? '#fffbeb' : '#f0f9ff',
                  borderRadius: '8px',
                  border: `1px solid ${item.type === 'warning' ? '#fde68a' : '#bae6fd'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={16} style={{ color: item.type === 'warning' ? '#d97706' : '#0284c7', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
                <Link
                  href={item.link}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                >
                  Review Details &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= 3. OPERATIONAL SUMMARY CARDS (FIRST ROW) ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: '24px',
      }}>
        {/* Card 1: Published Vacancies (Explicit, unambiguous metric) */}
        <Link
          href="/dashboard/vacancies"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="card" style={{
            padding: '20px 22px', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Published Vacancies</span>
              <div style={{ padding: 6, borderRadius: 8, background: '#fef3c7', color: '#b45309' }}>
                <Briefcase size={16} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 8 }}>
              {publishedCount}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {pendingReviewCount} in review &middot; {draftCount} draft
            </div>
          </div>
        </Link>

        {/* Card 2: Candidates to Review (Real count from database) */}
        <Link
          href="/dashboard/candidates"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="card" style={{
            padding: '20px 22px', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Candidates to Review</span>
              <div style={{ padding: 6, borderRadius: 8, background: '#dcfce7', color: '#059669' }}>
                <Users size={16} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 8 }}>
              {candidateCount}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {candidateCount === 0 ? 'No candidates currently waiting' : `${candidateCount} active candidate(s)`}
            </div>
          </div>
        </Link>

        {/* Card 3: Evidence to Review (Honest Candidate-Phase Preview) */}
        <Link
          href="/dashboard/evidence"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="card" style={{
            padding: '20px 22px', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Evidence to Review</span>
              <div style={{ padding: 6, borderRadius: 8, background: '#f1f5f9', color: '#475569' }}>
                <FileCheck size={16} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-muted)', lineHeight: 1.1, marginBottom: 8 }}>
              &mdash;
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Awaits candidate phase
            </div>
          </div>
        </Link>

        {/* Card 4: Upcoming Interviews (Honest Candidate-Phase Preview) */}
        <Link
          href="/dashboard/interviews"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="card" style={{
            padding: '20px 22px', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Interviews</span>
              <div style={{ padding: 6, borderRadius: 8, background: '#f1f5f9', color: '#475569' }}>
                <Calendar size={16} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-muted)', lineHeight: 1.1, marginBottom: 8 }}>
              &mdash;
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Interview scheduler preview
            </div>
          </div>
        </Link>
      </div>

      {/* ================= 4. MAIN OPERATIONAL TABLE: YOUR VACANCIES ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        {/* Table Header & Controls */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14, marginBottom: 18,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              Your Vacancies
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Manage requisitions, review requirement linkage, and monitor applicant pipelines.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div className="search-box" style={{ width: 220 }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vacancy..."
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-muted)' }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="form-select"
              style={{ width: 170, padding: '7px 28px 7px 12px', fontSize: 12.5 }}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            {/* Primary Action Button (Unified Vacancy Builder) */}
            <Link
              href="/dashboard/vacancies/builder"
              className="btn btn-gold btn-sm"
              style={{ gap: 6, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              <Plus size={14} />
              <span>Create Vacancy</span>
            </Link>
          </div>
        </div>

        {/* Vacancy Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Vacancy</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Requirements</th>
                <th style={{ textAlign: 'right' }}>Candidates</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVacancies.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {vacancies.length === 0 ? 'No vacancies created yet' : 'No matching vacancies found'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12.5, marginBottom: 16 }}>
                      {vacancies.length === 0
                        ? 'Define job vacancy specifications and connect required competencies to begin recruiting.'
                        : 'Try adjusting your search criteria or department filter.'}
                    </div>
                    {vacancies.length === 0 && (
                      <Link
                        href="/dashboard/vacancies/builder"
                        className="btn btn-gold btn-sm"
                        style={{ margin: '0 auto', gap: 6, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Plus size={14} />
                        <span>Create First Vacancy</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredVacancies.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link
                        href={`/dashboard/vacancies/${v.id}`}
                        style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}
                      >
                        {v.title}
                      </Link>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {v.location || 'Remote'} &middot; {v.employment_type ? v.employment_type.replace('_', ' ') : 'Full Time'} &middot; {v.openings} opening{v.openings !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{v.dept}</span>
                    </td>
                    <td>
                      {renderStatusBadge(v.status, v.raw_status)}
                    </td>
                    <td className="td-mono font-semibold" style={{ textAlign: 'right' }}>
                      {v.requirement_count ?? 0}
                    </td>
                    <td className="td-mono font-semibold" style={{ textAlign: 'right' }}>
                      {v.applications ?? 0}
                    </td>
                    <td className="td-muted td-mono" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                      {v.created}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/dashboard/vacancies/${v.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 12 }}
                      >
                        {v.status === 'draft' ? 'Continue' : 'View'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 5. TWO-COLUMN OPERATIONAL BASE: ACTIVITY & TRACEABILITY ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* Left: Recent Activity from Real Audit Logs */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '22px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Activity
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Workspace audit trail
            </span>
          </div>

          {activities.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No recent activity recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    paddingBottom: 10, borderBottom: '1px solid var(--border)', fontSize: 12.5,
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#b8860b',
                    marginTop: 5, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {act.action.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      By {act.actor_name || 'System'} &middot; {new Date(act.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {act.new_status && (
                    <span className="badge badge-gray" style={{ fontSize: 10 }}>
                      {act.new_status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Truthful Evidence Traceability Information */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '22px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ShieldCheck size={18} style={{ color: '#059669' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                Evidence Traceability
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 12px 0' }}>
              GenuAI organizes candidate evidence against vacancy requirements and preserves review history for recruiter evaluation.
            </p>
            <div style={{
              background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', border: '1px solid var(--border)',
              fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Requirement-linked review:</strong> Review assessment results, projects, experience, and submitted evidence against each vacancy requirement. Final hiring decisions always remain with the human recruiter.
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active departments: {departments.length}</span>
            <Link href="/dashboard/departments" style={{ fontSize: 12, fontWeight: 600, color: '#b8860b', textDecoration: 'none' }}>
              Manage Departments &rarr;
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
