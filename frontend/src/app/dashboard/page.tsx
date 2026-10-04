'use client';

import {
  Briefcase, Users, ClipboardCheck, Clock,
  Calendar, AlertTriangle, CheckCircle, ChevronRight, TrendingUp,
  ShieldAlert, Search, Sparkles, FileCheck, ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: 'Active Vacancies', value: '4', icon: Briefcase, sub: '2 in review, 2 active', cardClass: 'stat-card-gold', iconClass: 'stat-icon-gold' },
  { label: 'Total Candidates', value: '36', icon: Users, sub: 'Across all vacancies', cardClass: 'stat-card-brand', iconClass: 'stat-icon-brand' },
  { label: 'Assessed Candidates', value: '24', icon: ClipboardCheck, sub: 'Official assessment done', cardClass: 'stat-card-success', iconClass: 'stat-icon-success' },
  { label: 'Integrity Signals', value: '3', icon: ShieldAlert, sub: 'Requires recruiter review', cardClass: 'stat-card-warning', iconClass: 'stat-icon-warning' },
];

const actions = [
  {
    title: '12 candidates completed the official assessment',
    desc: 'Software Developer · Results ready for review',
    href: '/dashboard/candidates',
    icon: ClipboardCheck,
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    badge: 'Assessment Ready',
    badgeClass: 'badge-blue',
  },
  {
    title: '8 candidates have evidence gaps for high-priority requirements',
    desc: 'AWS, Docker not yet evaluated',
    href: '/dashboard/evidence',
    icon: AlertTriangle,
    iconBg: '#fffbeb',
    iconColor: '#d97706',
    badge: 'Action Required',
    badgeClass: 'badge-yellow',
  },
  {
    title: '5 interviews scheduled today',
    desc: 'Next: Mohamed J. at 2:30 PM',
    href: '/dashboard/interviews',
    icon: Calendar,
    iconBg: '#ecfdf5',
    iconColor: '#10b981',
    badge: 'Today',
    badgeClass: 'badge-green',
  },
  {
    title: '3 candidates have integrity signals requiring review',
    desc: 'Signals detected — human review recommended',
    href: '/dashboard/integrity',
    icon: ShieldAlert,
    iconBg: '#fef2f2',
    iconColor: '#ef4444',
    badge: 'Integrity Flag',
    badgeClass: 'badge-red',
  },
];

const recentVacancies = [
  { title: 'Software Developer', dept: 'Engineering', applications: 18, assessments: 12, interviews: 5, status: 'active' },
  { title: 'Senior DevOps Specialist', dept: 'Engineering', applications: 8, assessments: 6, interviews: 2, status: 'active' },
  { title: 'Data Engineer', dept: 'Data & Analytics', applications: 10, assessments: 6, interviews: 0, status: 'under_review' },
  { title: 'Product Manager', dept: 'Product', applications: 0, assessments: 0, interviews: 0, status: 'draft' },
];

const statusBadge: Record<string, string> = {
  active: 'badge-published',
  under_review: 'badge-pending',
  draft: 'badge-draft',
};

export default function DashboardPage() {
  return (
<<<<<<< HEAD
    <div className="page-content" style={{ background: 'var(--surface)', minHeight: '100vh', padding: '24px 32px 48px' }}>
      {/* ================= TOP RECRUITMENT INTELLIGENCE HERO BANNER ================= */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)',
        borderRadius: '16px',
        position: 'relative',
        padding: '28px 32px',
        marginBottom: '24px',
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
            <svg width="200" height="140" viewBox="0 0 200 140" fill="none" style={{ opacity: 0.85, overflow: 'visible' }}>
              {/* Connecting lines */}
              <line x1="100" y1="75" x2="45" y2="38" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="100" y1="75" x2="155" y2="38" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="100" y1="75" x2="28" y2="112" stroke="rgba(5,150,105,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="100" y1="75" x2="172" y2="112" stroke="rgba(5,150,105,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="100" y1="75" x2="100" y2="22" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
              {/* Center Node */}
              <circle cx="100" cy="75" r="18" fill="rgba(212,175,55,0.15)" stroke="#d4af37" strokeWidth="2" />
              <circle cx="100" cy="75" r="10" fill="rgba(212,175,55,0.3)" />
              <text x="100" y="79" textAnchor="middle" fill="#d4af37" fontSize="9" fontWeight="700">AI</text>
              {/* Satellite Nodes - moved inward to avoid clipping */}
              <circle cx="45" cy="38" r="14" fill="rgba(99,102,241,0.15)" stroke="#818cf8" strokeWidth="1.5" />
              <text x="45" y="42" textAnchor="middle" fill="#818cf8" fontSize="7" fontWeight="600">TARGET</text>
              <circle cx="155" cy="38" r="14" fill="rgba(5,150,105,0.15)" stroke="#34d399" strokeWidth="1.5" />
              <text x="155" y="42" textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="600">PROVE</text>
              <circle cx="28" cy="112" r="14" fill="rgba(212,175,55,0.1)" stroke="#d4af37" strokeWidth="1.5" />
              <text x="28" y="116" textAnchor="middle" fill="#d4af37" fontSize="7" fontWeight="600">LEARN</text>
              <circle cx="172" cy="112" r="14" fill="rgba(239,68,68,0.1)" stroke="#f87171" strokeWidth="1.5" />
              <text x="172" y="116" textAnchor="middle" fill="#f87171" fontSize="7" fontWeight="600">ASSESS</text>
              <circle cx="100" cy="22" r="13" fill="rgba(99,102,241,0.15)" stroke="#818cf8" strokeWidth="1.5" />
              <text x="100" y="26" textAnchor="middle" fill="#818cf8" fontSize="7" fontWeight="600">EVIDENCE</text>
              {/* Pulse rings */}
              <circle cx="100" cy="75" r="26" stroke="rgba(212,175,55,0.2)" strokeWidth="1" fill="none" />
              <circle cx="100" cy="75" r="36" stroke="rgba(212,175,55,0.08)" strokeWidth="1" fill="none" />
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
=======
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
>>>>>>> 9d843ea348e10e7bed616ff359598612e2447c04
          <div>
            <h1 className="page-title">
              Dashboard Overview
            </h1>
            <p className="page-subtitle">Welcome back, Sarah. Here is your recruitment pipeline activity for today.</p>
          </div>
          <Link href="/dashboard/vacancies" className="btn btn-gold">
            + Create New Vacancy
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`stat-card ${s.cardClass}`}>
              <div className={`stat-icon ${s.iconClass}`}>
                <Icon size={20} />
              </div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
        {/* Left Column — Action Required (Figma & Google Stitch Styled) */}
        <div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Action Required</div>
                <div className="card-subtitle">Items needing your attention in GenuAI Technologies</div>
              </div>
              <span className="gold-badge" style={{ padding: '4px 10px' }}>
                4 Pending Items
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {actions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <Link href={a.href} key={i} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        background: '#ffffff',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-md)',
                        transition: 'all 0.2s ease',
                        boxShadow: 'var(--shadow-xs)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                      }}
                    >
                      {/* Crisp SVG Icon Badge */}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: a.iconBg,
                          color: a.iconColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: `1px solid ${a.iconColor}33`,
                        }}
                      >
                        <Icon size={19} />
                      </div>

                      {/* Text content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2">
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {a.title}
                          </div>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>
                          {a.desc}
                        </div>
                      </div>

                      {/* Badge & Action Indicator */}
                      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                        <span className={`badge ${a.badgeClass}`} style={{ fontSize: 10.5 }}>
                          {a.badge}
                        </span>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column — Active Vacancies & Trends */}
        <div className="flex flex-col gap-6">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Active Vacancies</div>
                <div className="card-subtitle">Recruitment pipeline summary</div>
              </div>
              <Link href="/dashboard/vacancies" className="btn btn-secondary btn-sm">
                View All
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentVacancies.map((v) => (
                <div key={v.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 4 }}>{v.title}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                      <span>{v.applications} applied</span>
                      <span>•</span>
                      <span>{v.assessments} assessed</span>
                      <span>•</span>
                      <span>{v.interviews} interviews</span>
                    </div>
                  </div>
                  <span className={`badge ${statusBadge[v.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                    {v.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trend Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Weekly Pipeline Metrics</div>
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'New Applications Received', value: '+12', color: 'var(--brand)' },
                { label: 'Official Assessments Completed', value: '+8', color: 'var(--success)' },
                { label: 'Technical Interviews Conducted', value: '+3', color: '#d97706' },
                { label: 'Verified Offers Extended', value: '+1', color: '#6d28d9' },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between" style={{ padding: '4px 0' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
