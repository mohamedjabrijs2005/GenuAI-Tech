'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Briefcase, Target, ClipboardList,
  Users, Shield, Mic2, BrainCircuit, FileCheck, Settings,
  Bell, FileText, HandshakeIcon, LogOut, ChevronRight, Sparkles, ScrollText,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
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
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Recruitment',
    items: [
      { label: 'Vacancies', href: '/dashboard/vacancies', icon: Briefcase },
      { label: 'Candidates', href: '/dashboard/candidates', icon: Users },
    ],
  },
  {
    section: 'Organization',
    items: [
      { label: 'Departments', href: '/dashboard/departments', icon: Building2 },
      { label: 'Company Profile', href: '/dashboard/company-profile', icon: Building2 },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
  {
    section: 'Candidate Intelligence',
    items: [
      { label: 'Evidence Review', href: '/dashboard/evidence', icon: FileCheck },
      { label: 'Coverage & Gaps', href: '/dashboard/evidence/coverage', icon: Shield },
      { label: 'Assessment Setup', href: '/dashboard/assessments', icon: ClipboardList },
      { label: 'Integrity Signals', href: '/dashboard/integrity', icon: Shield },
      { label: 'Interviews', href: '/dashboard/interviews', icon: Mic2 },
      { label: 'Reports', href: '/dashboard/reports', icon: FileText },
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

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';
  const displayEmail = user?.email || '';
  const companyName = company?.name || 'Workspace';
  const isVerified = company?.verificationStatus === 'VERIFIED';
  const initials = user ? `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`.toUpperCase() : 'U';

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* BRANDING HEADER */}
      <div className="sidebar-logo">
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
                  style={item.comingSoon ? { opacity: 0.7 } : undefined}
                >
                  <Icon size={16} style={{ color: active ? '#a16207' : undefined }} />
                  <span>{item.label}</span>
                  {item.comingSoon && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(148, 163, 184, 0.15)',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                    }}>
                      Soon
                    </span>
                  )}
                  {active && !item.comingSoon && <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#a16207' }} />}
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
