'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Building2, Users2, FileCheck2,
  Mic2, BrainCircuit, Settings, LogOut, ChevronRight,
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    section: '',
    items: [
      { label: 'Overview', href: '/dashboard', icon: <LayoutDashboard size={15} /> },
    ],
  },
  {
    section: 'Organization',
    items: [
      { label: 'Company Profile', href: '/dashboard/company-profile', icon: <Building2 size={15} /> },
      { label: 'Departments & Roles', href: '/dashboard/departments', icon: <Users2 size={15} /> },
    ],
  },
  {
    section: 'Recruitment',
    items: [
      { label: 'Candidates', icon: <Users2 size={15} />, comingSoon: true },
    ],
  },
  {
    section: 'Evaluations',
    items: [
      { label: 'Assessments', icon: <FileCheck2 size={15} />, comingSoon: true },
      { label: 'Interviews', icon: <Mic2 size={15} />, comingSoon: true },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { label: 'Recruitment Intelligence', icon: <BrainCircuit size={15} />, comingSoon: true },
    ],
  },
  {
    section: 'Settings',
    items: [
      { label: 'Settings', icon: <Settings size={15} />, comingSoon: true },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, company, logout } = useAuth();

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">G</div>
        <div>
          <div className="sidebar-logo-text">GenuAI</div>
          <span className="sidebar-logo-sub">Technologies</span>
        </div>
      </div>

      {/* Company name */}
      {company && (
        <div style={{ padding: '10px 20px 8px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>Workspace</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {company.name}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV.map((section) => (
          <div key={section.section || 'root'}>
            {section.section && (
              <div className="sidebar-section-label">{section.section}</div>
            )}
            {section.items.map((item) => {
              if (item.comingSoon) {
                return (
                  <div
                    key={item.label}
                    className="sidebar-nav-item coming-soon"
                    aria-disabled="true"
                    title={`${item.label} — Coming soon`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <span className="coming-soon-badge">Soon</span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  className={`sidebar-nav-item${isActive(item.href) ? ' active' : ''}`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive(item.href) && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={logout} title="Sign out" role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') logout(); }}>
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.firstName} {user?.lastName}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <LogOut size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
