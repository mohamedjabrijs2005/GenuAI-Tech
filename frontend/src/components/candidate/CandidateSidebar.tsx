'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  FileCheck,
  BookOpen,
  ClipboardCheck,
  BadgeCheck,
  ChevronRight,
  LogOut,
  Target,
  Shield,
  Layers,
  Bell,
  Sliders,
  Accessibility,
  Eye,
  Calendar,
  CheckCircle2,
  Briefcase,
  User,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface TargetSummary {
  target_id: string;
  vacancy_title: string;
  company_name: string;
  target_status: string;
}

export function CandidateSidebar({
  isMobileOpen = false,
  onCloseMobile,
}: {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [targets, setTargets] = useState<TargetSummary[]>([]);
  const [activeTargetId, setActiveTargetId] = useState<string>('');
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  // Detect active target from URL or select first available
  useEffect(() => {
    let isMounted = true;
    api
      .get('/candidate-portal/targets')
      .then((res) => {
        if (!isMounted) return;
        const targetList = res.data?.targets || [];
        setTargets(targetList);

        // Check if URL has target id: /candidate/targets/[id]/...
        const targetMatch = pathname.match(/\/candidate\/targets\/([0-9a-fA-F-]+)/);
        if (targetMatch && targetMatch[1]) {
          setActiveTargetId(targetMatch[1]);
        } else if (targetList.length > 0 && !activeTargetId) {
          const stored = typeof window !== 'undefined' ? localStorage.getItem('genuai_active_target') : null;
          if (stored && targetList.some((t: TargetSummary) => t.target_id === stored)) {
            setActiveTargetId(stored);
          } else {
            setActiveTargetId(targetList[0].target_id);
          }
        }
      })
      .catch(() => {});

    api
      .get('/candidate-portal/notifications')
      .then((res) => {
        if (!isMounted) return;
        const notifs = res.data?.notifications || [];
        setUnreadNotifsCount(notifs.filter((n: any) => !n.is_read).length);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleTargetChange = (newTargetId: string) => {
    setActiveTargetId(newTargetId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('genuai_active_target', newTargetId);
    }
    if (pathname.includes('/candidate/targets/')) {
      // Re-route to current submodule on new target
      const subPath = pathname.split('/').slice(4).join('/');
      router.push(`/candidate/targets/${newTargetId}${subPath ? `/${subPath}` : ''}`);
    }
  };

  const selectedTarget = targets.find((t) => t.target_id === activeTargetId) || targets[0];
  const targetId = selectedTarget?.target_id || '';

  const isActive = (href: string) => {
    if (href === '/candidate') return pathname === '/candidate';
    return pathname === href || (pathname.startsWith(href + '/') && href !== '/candidate');
  };

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Candidate Workspace';

  return (
    <aside
      className={`sidebar candidate-sidebar ${isMobileOpen ? 'open' : ''}`}
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
      role="navigation"
      aria-label="Candidate Navigation"
    >
      {/* Brand Header */}
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
          <span
            className="sidebar-logo-sub"
            style={{
              fontSize: 10,
              color: '#854d0e',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Candidate Workspace
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav
        className="sidebar-nav"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* OVERVIEW */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#94a3b8',
              letterSpacing: '0.8px',
              padding: '0 8px 4px',
              textTransform: 'uppercase',
            }}
          >
            OVERVIEW
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Link
              href="/candidate"
              onClick={onCloseMobile}
              className={`sidebar-nav-item${isActive('/candidate') ? ' active' : ''}`}
            >
              <LayoutDashboard size={16} />
              <span>My Dashboard</span>
            </Link>
          </div>
        </div>

        {/* OPPORTUNITIES */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#94a3b8',
              letterSpacing: '0.8px',
              padding: '0 8px 4px',
              textTransform: 'uppercase',
            }}
          >
            OPPORTUNITIES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Link
              href="/candidate/vacancies"
              onClick={onCloseMobile}
              className={`sidebar-nav-item${isActive('/candidate/vacancies') ? ' active' : ''}`}
            >
              <Compass size={16} />
              <span>Explore Vacancies</span>
            </Link>
            <Link
              href="/candidate/targets"
              onClick={onCloseMobile}
              className={`sidebar-nav-item${isActive('/candidate/targets') && !pathname.includes('/requirements') && !pathname.includes('/learn') && !pathname.includes('/practice') && !pathname.includes('/assessment') && !pathname.includes('/evidence') && !pathname.includes('/coverage') && !pathname.includes('/interview') ? ' active' : ''}`}
            >
              <Target size={16} />
              <span>My Targets</span>
              {targets.length > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 99,
                    background: 'rgba(212, 175, 55, 0.15)',
                    color: '#854d0e',
                  }}
                >
                  {targets.length}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* PROFILE */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#94a3b8',
              letterSpacing: '0.8px',
              padding: '0 8px 4px',
              textTransform: 'uppercase',
            }}
          >
            PROFILE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Link
              href="/candidate/profile"
              onClick={onCloseMobile}
              className={`sidebar-nav-item${isActive('/candidate/profile') ? ' active' : ''}`}
            >
              <User size={16} />
              <span>My Profile</span>
            </Link>
          </div>
        </div>

        {/* TARGET WORKSPACE */}
        <div>
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
            TARGET WORKSPACE
          </div>

          {/* Compact target selector inside this section */}
          {targets.length > 1 ? (
            <select
              value={targetId}
              onChange={(e) => handleTargetChange(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: 11.5,
                fontWeight: 600,
                color: '#1e293b',
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: 6,
                outline: 'none',
                cursor: 'pointer',
                marginBottom: 6,
              }}
              aria-label="Active Target Selection"
            >
              {targets.map((t) => (
                <option key={t.target_id} value={t.target_id}>
                  {t.vacancy_title}
                </option>
              ))}
            </select>
          ) : selectedTarget ? (
            <div style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: '#854d0e',
              padding: '4px 8px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Target size={12} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedTarget.vacancy_title}
              </span>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {targetId ? (
              <>
                <Link
                  href={`/candidate/targets/${targetId}/requirements`}
                  onClick={onCloseMobile}
                  className={`sidebar-nav-item${isActive(`/candidate/targets/${targetId}/requirements`) ? ' active' : ''}`}
                >
                  <Layers size={16} />
                  <span>Requirements</span>
                </Link>
                <Link
                  href={`/candidate/targets/${targetId}/learn`}
                  onClick={onCloseMobile}
                  className={`sidebar-nav-item${isActive(`/candidate/targets/${targetId}/learn`) ? ' active' : ''}`}
                >
                  <BookOpen size={16} />
                  <span>Learn</span>
                </Link>
                <Link
                  href={`/candidate/targets/${targetId}/practice`}
                  onClick={onCloseMobile}
                  className={`sidebar-nav-item${isActive(`/candidate/targets/${targetId}/practice`) ? ' active' : ''}`}
                >
                  <ClipboardCheck size={16} />
                  <span>Practice</span>
                </Link>
                <Link
                  href={`/candidate/targets/${targetId}/assessment`}
                  onClick={onCloseMobile}
                  className={`sidebar-nav-item${isActive(`/candidate/targets/${targetId}/assessment`) ? ' active' : ''}`}
                >
                  <BadgeCheck size={16} />
                  <span>Assessment</span>
                </Link>
                <Link
                  href={`/candidate/targets/${targetId}/evidence`}
                  onClick={onCloseMobile}
                  className={`sidebar-nav-item${isActive(`/candidate/targets/${targetId}/evidence`) ? ' active' : ''}`}
                >
                  <FileCheck size={16} />
                  <span>Evidence Locker</span>
                </Link>
                <Link
                  href={`/candidate/targets/${targetId}/coverage`}
                  onClick={onCloseMobile}
                  className={`sidebar-nav-item${isActive(`/candidate/targets/${targetId}/coverage`) ? ' active' : ''}`}
                >
                  <Shield size={16} />
                  <span>Coverage &amp; Gaps</span>
                </Link>
                <Link
                  href={`/candidate/targets/${targetId}/interview`}
                  onClick={onCloseMobile}
                  className={`sidebar-nav-item${isActive(`/candidate/targets/${targetId}/interview`) ? ' active' : ''}`}
                >
                  <Calendar size={16} />
                  <span>Interview</span>
                </Link>
              </>
            ) : (
              <Link
                href="/candidate/vacancies"
                onClick={onCloseMobile}
                style={{
                  padding: '8px 10px',
                  fontSize: 11.5,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 6,
                  border: '1px dashed #cbd5e1',
                  background: '#f8fafc',
                }}
              >
                <Compass size={13} />
                + Target a Published Vacancy
              </Link>
            )}
          </div>
        </div>

        {/* ACCOUNT & PRIVACY */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#94a3b8',
              letterSpacing: '0.8px',
              padding: '0 8px 4px',
              textTransform: 'uppercase',
            }}
          >
            ACCOUNT
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Link
              href="/candidate/notifications"
              onClick={onCloseMobile}
              className={`sidebar-nav-item${isActive('/candidate/notifications') ? ' active' : ''}`}
            >
              <Bell size={16} />
              <span>Notifications</span>
              {unreadNotifsCount > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 99,
                    background: '#ef4444',
                    color: '#ffffff',
                  }}
                >
                  {unreadNotifsCount}
                </span>
              )}
            </Link>
            <Link
              href="/candidate/privacy"
              onClick={onCloseMobile}
              className={`sidebar-nav-item${isActive('/candidate/privacy') ? ' active' : ''}`}
            >
              <Shield size={16} />
              <span>Privacy & Data</span>
            </Link>
            <Link
              href="/candidate/accessibility"
              onClick={onCloseMobile}
              className={`sidebar-nav-item${isActive('/candidate/accessibility') ? ' active' : ''}`}
            >
              <Accessibility size={16} />
              <span>Accommodations</span>
            </Link>
            <Link
              href="/candidate/settings"
              onClick={onCloseMobile}
              className={`sidebar-nav-item${isActive('/candidate/settings') ? ' active' : ''}`}
            >
              <Sliders size={16} />
              <span>Settings</span>
            </Link>
            <Link
              href="/candidate/subscription"
              onClick={onCloseMobile}
              className={`sidebar-nav-item${isActive('/candidate/subscription') ? ' active' : ''}`}
            >
              <CreditCard size={16} />
              <span>Subscription</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div
        className="sidebar-footer"
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e293b, #334155)',
              color: '#d4af37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {user?.firstName?.[0] || 'C'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#1e293b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.email || 'Candidate'}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Log out"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Log Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
