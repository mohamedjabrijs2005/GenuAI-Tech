'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  ClipboardList,
  Users,
  Gavel,
  ShieldCheck,
  ScrollText,
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: string | number;
  badgeColor?: 'danger' | 'warning' | 'gold' | 'neutral';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminSidebar({ isMobileOpen = false, onCloseMobile }: { isMobileOpen?: boolean; onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { adminUser } = useAdminAuth();
  const { logout } = useAuth();

  const [counts, setCounts] = useState({
    pendingCompanies: 0,
    pendingVacancies: 0,
  });

  useEffect(() => {
    let isMounted = true;
    api.get('/admin/overview')
      .then((res) => {
        if (!isMounted) return;
        const metrics = res.data?.metrics || {};
        setCounts({
          pendingCompanies: metrics.pendingCompanyVerifications || 0,
          pendingVacancies: metrics.vacanciesPendingReview || 0,
        });
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [pathname]);

  const NAV_SECTIONS: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      title: 'VERIFICATION',
      items: [
        {
          label: 'Companies',
          href: '/admin/verification/companies',
          icon: Building2,
          badge: counts.pendingCompanies > 0 ? counts.pendingCompanies : undefined,
          badgeColor: 'gold',
        },
        {
          label: 'Vacancies',
          href: '/admin/verification/vacancies',
          icon: Briefcase,
          badge: counts.pendingVacancies > 0 ? counts.pendingVacancies : undefined,
          badgeColor: 'warning',
        },
        {
          label: 'Assessments',
          href: '/admin/verification/assessments',
          icon: ClipboardList,
        },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Reports & Disputes', href: '/admin/disputes', icon: Gavel },
        { label: 'Integrity Review', href: '/admin/integrity', icon: ShieldCheck },
      ],
    },
    {
      title: 'AUDIT & SECURITY',
      items: [
        { label: 'Audit Trail', href: '/admin/audit', icon: ScrollText },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Settings', href: '/admin/settings', icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case 'danger':  return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'warning': return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'gold':    return { bg: 'rgba(212, 175, 55, 0.15)', text: '#854d0e', border: 'rgba(212, 175, 55, 0.4)' };
      default:        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <aside
      className={`admin-sidebar ${isMobileOpen ? 'open' : ''}`}
      style={{
        width: '270px',
        background: '#ffffff',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        height: '100vh',
        zIndex: 110,
        boxShadow: '1px 0 3px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Brand Header — matches Company Dashboard (text-only, no logo box) */}
      <div
        className="sidebar-logo"
        style={{
          padding: '16px 20px',
          height: '64px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div>
          <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 15 }}>
            GenuAI Technologies
          </div>
          <span className="sidebar-logo-sub" style={{ fontSize: 10, color: '#854d0e', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Operational Control Center
          </span>
        </div>
      </div>

      {/* Workspace Identity — matches Company Dashboard workspace block */}
      <div
        className="sidebar-workspace"
        style={{
          padding: '10px 18px',
          background: '#fafaf9',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <span className="sidebar-workspace-label" style={{ margin: 0, fontSize: 10 }}>
            WORKSPACE
          </span>
          <span className="gold-badge" style={{ fontSize: 9.5, padding: '1px 6px', flexShrink: 0 }}>
            <span className="badge-dot" style={{ background: '#d4af37', width: 5, height: 5 }} />
            Active
          </span>
        </div>
        <div className="sidebar-workspace-name" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          GenuAI Platform Administration
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="sidebar-nav"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#94a3b8',
                letterSpacing: '0.8px',
                padding: '0 8px 6px',
                textTransform: 'uppercase',
              }}
            >
              {section.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const bStyle = getBadgeStyle(item.badgeColor);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`sidebar-nav-item${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      borderLeft: active ? '3px solid #b8860b' : '3px solid transparent',
                    }}
                  >
                    <Icon
                      size={15}
                      style={{
                        color: active ? '#b8860b' : '#64748b',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '99px',
                          background: bStyle.bg,
                          color: bStyle.text,
                          border: `1px solid ${bStyle.border}`,
                          flexShrink: 0,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight size={13} style={{ color: '#b8860b', flexShrink: 0, marginLeft: 'auto' }} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer — matches Company Dashboard footer exactly (single sign-out via LogOut icon) */}
      <div
        className="sidebar-footer"
        style={{ flexShrink: 0 }}
      >
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px 6px' }}>
          {adminUser.role || 'Super Admin'}
        </div>
        <div
          className="sidebar-user"
          role="button"
          tabIndex={0}
          onClick={logout}
          onKeyDown={(e) => e.key === 'Enter' && logout()}
          aria-label="Sign out"
          title="Sign out"
        >
          <div className="user-avatar" style={{ background: '#b8860b', color: '#ffffff' }}>
            {adminUser.avatar}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="user-name">{adminUser.name}</div>
            <div className="user-email">{adminUser.email}</div>
          </div>
          <LogOut size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
