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
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title flex items-center gap-3">
              Dashboard Overview
              <span className="gold-badge">
                <Sparkles size={12} />
                GenuAI Technologies
              </span>
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
