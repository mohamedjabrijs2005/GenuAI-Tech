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
  FileCheck2,
  Shield,
  BarChart3,
  Tags,
  Layers,
  Bell,
  ScrollText,
  Activity,
  Settings,
  ChevronRight,
  ShieldQuestion,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { adminDataService } from '@/lib/adminDataService';

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
  const { adminUser, unreadNotificationsCount } = useAdminAuth();

  // ─── Live badge counts from adminDataService ───────────────────────────────
  const computeCounts = () => {
    const companies   = adminDataService.getCompanies();
    const vacancies   = adminDataService.getVacancies();
    const assessments = adminDataService.getAssessments();
    const moderation  = adminDataService.getModerationReports();
    const disputes    = adminDataService.getDisputes();
    const integrity   = adminDataService.getIntegrityIncidents();
    const security    = adminDataService.getSecurityEvents();

    return {
      pendingCompanies:    companies.filter(c => c.verificationStatus === 'Pending' || c.verificationStatus === 'Under Review').length,
      pendingVacancies:    vacancies.filter(v => v.status === 'Pending Review').length,
      flaggedAssessments:  assessments.filter(a => a.status === 'Pending Review' || a.status === 'Flagged').length,
      openModeration:      moderation.filter(m => m.status === 'Open' || m.status === 'Investigating' || m.status === 'Action Required').length,
      highDisputes:        disputes.filter(d => (d.status === 'Open' || d.status === 'Investigating') && (d.priority === 'High' || d.priority === 'Urgent')).length,
      openIntegrity:       integrity.filter(i => i.status === 'Open' || i.status === 'Under Investigation').length,
      activeSecurityEvents: security.filter(s => s.status === 'Active' || s.status === 'Investigating').length,
    };
  };

  const [counts, setCounts] = useState(computeCounts);

  useEffect(() => {
    const unsub = adminDataService.subscribe(() => setCounts(computeCounts()));
    return () => unsub();
  }, []);

  // ─── Build nav sections dynamically using live counts ─────────────────────
  const buildBadge = (count: number, suffix?: string): { badge?: string | number; badgeColor?: NavItem['badgeColor'] } => {
    if (count === 0) return {};
    return { badge: suffix ? `${count} ${suffix}` : count };
  };

  const NAV_SECTIONS: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Admin Overview', href: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      title: 'VERIFICATION & GOVERNANCE',
      items: [
        {
          label: 'Companies',
          href: '/admin/verification/companies',
          icon: Building2,
          ...buildBadge(counts.pendingCompanies, 'Pending'),
          badgeColor: counts.pendingCompanies > 0 ? 'gold' : undefined,
        },
        {
          label: 'Vacancies',
          href: '/admin/verification/vacancies',
          icon: Briefcase,
          ...buildBadge(counts.pendingVacancies, 'Review'),
          badgeColor: counts.pendingVacancies > 0 ? 'warning' : undefined,
        },
        {
          label: 'Assessments',
          href: '/admin/verification/assessments',
          icon: ClipboardList,
          ...buildBadge(counts.flaggedAssessments, counts.flaggedAssessments === 1 ? 'Flagged' : 'Flagged'),
          badgeColor: counts.flaggedAssessments > 0 ? 'danger' : undefined,
        },
      ],
    },
    {
      title: 'USER GOVERNANCE',
      items: [
        { label: 'Platform Users', href: '/admin/users', icon: Users },
      ],
    },
    {
      title: 'MODERATION & DISPUTES',
      items: [
        {
          label: 'Content Review',
          href: '/admin/moderation',
          icon: ShieldQuestion,
          ...buildBadge(counts.openModeration, 'Open'),
          badgeColor: counts.openModeration > 0 ? 'danger' : undefined,
        },
        {
          label: 'Dispute Center',
          href: '/admin/disputes',
          icon: Gavel,
          ...buildBadge(counts.highDisputes, 'High'),
          badgeColor: counts.highDisputes > 0 ? 'warning' : undefined,
        },
      ],
    },
    {
      title: 'INTEGRITY & TRUST',
      items: [
        {
          label: 'Integrity Incidents',
          href: '/admin/integrity',
          icon: ShieldCheck,
          ...buildBadge(counts.openIntegrity, 'Alert'),
          badgeColor: counts.openIntegrity > 0 ? 'danger' : undefined,
        },
        { label: 'Evidence Oversight', href: '/admin/evidence', icon: FileCheck2 },
        {
          label: 'Security Events',
          href: '/admin/security',
          icon: Shield,
          ...buildBadge(counts.activeSecurityEvents, 'Active'),
          badgeColor: counts.activeSecurityEvents > 0 ? 'warning' : undefined,
        },
      ],
    },
    {
      title: 'PLATFORM INTELLIGENCE',
      items: [
        { label: 'Platform Analytics', href: '/admin/analytics', icon: BarChart3 },
        { label: 'Role Taxonomy', href: '/admin/taxonomy/roles', icon: Tags },
        { label: 'Assessment Taxonomy', href: '/admin/taxonomy/assessments', icon: Layers },
      ],
    },
    {
      title: 'SYSTEM & AUDIT',
      items: [
        {
          label: 'Notifications',
          href: '/admin/notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          badgeColor: 'danger',
        },
        { label: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
        { label: 'System Health', href: '/admin/system', icon: Activity, badge: 'Healthy', badgeColor: 'neutral' },
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
        zIndex: 110,
        boxShadow: '1px 0 3px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '16px 20px',
          height: '64px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #854d0e 0%, #b8860b 50%, #d4af37 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '15px',
            boxShadow: '0 2px 8px rgba(184, 134, 11, 0.3)',
            border: '1px solid rgba(254, 240, 138, 0.4)',
            flexShrink: 0,
          }}
        >
          G
        </div>
        <div>
          <div
            style={{
              fontSize: '14.5px',
              fontWeight: 800,
              letterSpacing: '-0.3px',
              background: 'linear-gradient(135deg, #854d0e 0%, #b8860b 50%, #d4af37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}
          >
            GenuAI Console
          </div>
          <div style={{ fontSize: '10px', color: '#854d0e', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            Platform Governance
          </div>
        </div>
      </div>

      {/* Governance Scope Pill */}
      <div
        style={{
          padding: '10px 18px',
          background: '#f8fafc',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
          SCOPE: PLATFORM ROOT
        </span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '99px',
            background: 'rgba(212, 175, 55, 0.15)',
            color: '#854d0e',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          Governed
        </span>
      </div>

      {/* Navigation List */}
      <nav
        style={{
          flex: 1,
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '7px 10px',
                      borderRadius: '7px',
                      fontSize: '12.5px',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#854d0e' : 'var(--text-primary)',
                      background: active ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                      borderLeft: active ? '3px solid #b8860b' : '3px solid transparent',
                      transition: 'all 0.15s ease',
                      textDecoration: 'none',
                    }}
                    className={!active ? 'hover:bg-slate-100/70 hover:text-amber-950' : ''}
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
                    {active && <ChevronRight size={13} style={{ color: '#b8860b', flexShrink: 0 }} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin Identity Footer */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border)',
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#b8860b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {adminUser.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {adminUser.name}
            </div>
            <div style={{ fontSize: '10.5px', color: '#854d0e', fontWeight: 600 }}>
              {adminUser.role}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
