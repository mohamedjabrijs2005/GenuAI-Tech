'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Briefcase, Target, ClipboardList,
  Users, Shield, Mic2, BrainCircuit, FileCheck, Settings,
  Bell, FileText, HandshakeIcon, LogOut, ChevronRight, Sparkles, ScrollText,
} from 'lucide-react';

const NAV = [
  {
    section: '',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Company',
    items: [
      { label: 'Company Profile', href: '/dashboard/company-profile', icon: Building2 },
    ],
  },
  {
    section: 'Recruitment',
    items: [
      { label: 'Vacancies', href: '/dashboard/vacancies', icon: Briefcase },
      { label: 'Role Requirements', href: '/dashboard/requirements', icon: Target },
      { label: 'Assessment Setup', href: '/dashboard/assessments', icon: ClipboardList },
    ],
  },
  {
    section: 'Candidates',
    items: [
      { label: 'Candidates', href: '/dashboard/candidates', icon: Users },
      { label: 'Evidence & Coverage', href: '/dashboard/evidence', icon: FileCheck },
      { label: 'Interviews', href: '/dashboard/interviews', icon: Mic2 },
      { label: 'Integrity Review', href: '/dashboard/integrity', icon: Shield },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { label: 'Recruiter Intelligence', href: '/dashboard/intelligence', icon: BrainCircuit },
      { label: 'Role Intelligence', href: '/dashboard/intelligence/role-intelligence', icon: Sparkles },
      { label: 'Reports', href: '/dashboard/reports', icon: FileText },
    ],
  },
  {
    section: 'Platform',
    items: [
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { label: 'Recruitment Agreement', href: '/dashboard/agreement', icon: HandshakeIcon },
      { label: 'Audit Trail', href: '/dashboard/audit', icon: ScrollText },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, company, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/dashboard/intelligence') return pathname === '/dashboard/intelligence';
    return pathname === href || (pathname.startsWith(href + '/') && href !== '/dashboard');
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Authenticated User';
  const displayEmail = user?.email || 'user@genuai.io';
  const companyName = company?.name || 'Company Workspace';
  const isVerified = company?.verificationStatus === 'VERIFIED';
  const initials = user ? `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}` : 'U';

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* GOLD BRANDING HEADER */}
      <div className="sidebar-logo">
        <div className="gold-logo-box">
          <Sparkles size={18} style={{ color: '#ffffff' }} />
        </div>
        <div>
          <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 15 }}>GenuAI Technologies</div>
          <span className="sidebar-logo-sub">Enterprise Suite</span>
        </div>
      </div>

      {/* Company Workspace */}
      <div className="sidebar-workspace" style={{ padding: '10px 18px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
          <span className="sidebar-workspace-label" style={{ margin: 0 }}>WORKSPACE</span>
          {isVerified ? (
            <span className="gold-badge" style={{ fontSize: 9.5, padding: '1px 6px', flexShrink: 0 }}>
              <span className="badge-dot" style={{ background: '#d4af37', width: 5, height: 5 }} />
              Verified
            </span>
          ) : (
            <span className="badge badge-gray" style={{ fontSize: 9.5, padding: '1px 6px', flexShrink: 0 }}>
              {company?.verificationStatus || 'Unverified'}
            </span>
          )}
        </div>
        <div className="sidebar-workspace-name" style={{ fontSize: 13, fontWeight: 700 }}>
          {companyName}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV.map((group) => (
          <div key={group.section || 'root'}>
            {group.section && <div className="sidebar-section-label">{group.section}</div>}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`sidebar-nav-item${active ? ' active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={16} style={{ color: active ? '#a16207' : undefined }} />
                  <span>{item.label}</span>
                  {active && <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#a16207' }} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px 6px' }}>
          {user?.role?.replace('_', ' ') || 'Company Admin'}
        </div>
        <div className="sidebar-user" role="button" tabIndex={0} aria-label="User menu" onClick={logout}>
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="user-name">{displayName}</div>
            <div className="user-email">{displayEmail}</div>
          </div>
          <LogOut size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
