'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Briefcase, Target, ClipboardList,
  Users, Shield, Mic2, FileCheck, Settings,
  Bell, FileText, HandshakeIcon, LogOut, ChevronRight, CreditCard, ScrollText, BarChart3,
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
      { label: 'Role Readiness', href: '/dashboard/readiness', icon: BarChart3 },
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
    section: 'Review & Assessment',
    items: [
      { label: 'Evidence Review', href: '/dashboard/evidence', icon: FileCheck },
      { label: 'Coverage & Gaps', href: '/dashboard/evidence/coverage', icon: Shield },
      { label: 'Assessment Setup', href: '/dashboard/assessments', icon: ClipboardList },
      { label: 'Integrity Signals', href: '/dashboard/integrity', icon: Shield },
      { label: 'Interviews', href: '/dashboard/interviews', icon: Mic2 },
      { label: 'Reports', href: '/dashboard/reports', icon: FileText },
    ],
  },
  {
    section: 'Account',
    items: [
      { label: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
    ],
  },
];



import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, company, logout } = useAuth();

  const currentPath = (pathname || '/dashboard').replace(/\/$/, '') || '/';

  // Compute all navigation item hrefs across sections
  const allHrefs = NAV.flatMap((section) => section.items.map((item) => item.href));

  // Determine the single most specific matching href for currentPath
  const activeHref = currentPath === '/dashboard'
    ? '/dashboard'
    : allHrefs
        .filter((h) => currentPath === h || (currentPath.startsWith(h + '/') && h !== '/dashboard'))
        .sort((a, b) => b.length - a.length)[0] || '';

  const isActive = (href: string) => href === activeHref;

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';
  const displayEmail = user?.email || '';
  const companyName = company?.name || 'Workspace';
  const rawStatus = (company?.verificationStatus || 'PENDING_VERIFICATION').toUpperCase();
  const getStatusBadge = () => {
    if (rawStatus === 'APPROVED' || rawStatus === 'VERIFIED') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
          background: 'rgba(5, 150, 105, 0.1)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.25)',
          flexShrink: 0,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#059669' }} />
          Approved
        </span>
      );
    }
    if (rawStatus === 'UNDER_REVIEW') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
          background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.25)',
          flexShrink: 0,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb' }} />
          Under Review
        </span>
      );
    }
    if (rawStatus === 'ADDITIONAL_INFORMATION_REQUIRED' || rawStatus === 'CHANGES_REQUESTED') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
          background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.25)',
          flexShrink: 0,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#d97706' }} />
          Action Req.
        </span>
      );
    }
    if (rawStatus === 'REJECTED' || rawStatus === 'SUSPENDED') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
          background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.25)',
          flexShrink: 0,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#dc2626' }} />
          {rawStatus === 'SUSPENDED' ? 'Suspended' : 'Rejected'}
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
        background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.25)',
        flexShrink: 0,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#d97706' }} />
        Pending
      </span>
    );
  };
  const initials = user ? `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`.toUpperCase() : 'U';

  return (
    <aside
      className={`sidebar ${isMobileOpen ? 'open' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* BRANDING HEADER */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 15 }}>GenuAI Technologies</div>
          <span className="sidebar-logo-sub">Enterprise Suite</span>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="sidebar-close-btn"
            aria-label="Close sidebar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              background: '#f8fafc',
              border: '1px solid var(--border)',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Company Workspace */}
      <div className="sidebar-workspace" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span className="sidebar-workspace-label" style={{ margin: 0, fontSize: 10, letterSpacing: '0.8px', fontWeight: 800, color: '#64748b' }}>
            WORKSPACE
          </span>
          {getStatusBadge()}
        </div>
        <div className="sidebar-workspace-name" style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                  onClick={onCloseMobile}
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
