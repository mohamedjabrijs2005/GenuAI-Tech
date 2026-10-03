'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  HelpCircle,
  Wifi,
  WifiOff,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAdminAuth, RealtimeStatus } from '@/contexts/AdminAuthContext';
import { useAuth } from '@/contexts/AuthContext';

export function AdminTopbar() {
  const { logout } = useAuth();
  const {
    adminUser,
    realtimeStatus,
    setIsSearchOpen,
    setIsHelpOpen,
  } = useAdminAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getRealtimeIndicator = () => {
    switch (realtimeStatus) {
      case 'Connected':
        return { dotColor: '#10b981', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', label: 'Connected', Icon: Wifi };
      case 'Reconnecting':
        return { dotColor: '#f59e0b', bg: '#fffbeb', text: '#92400e', border: '#fde68a', label: 'Reconnecting…', Icon: Wifi };
      case 'Offline':
        return { dotColor: '#ef4444', bg: '#fef2f2', text: '#991b1b', border: '#fecaca', label: 'Offline', Icon: WifiOff };
    }
  };

  const rt = getRealtimeIndicator();

  return (
    <header
      style={{
        height: '64px',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        gap: '20px',
      }}
    >
      {/* Left: Console Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '4px',
            background: '#191c1e',
            color: '#ffffff',
            letterSpacing: '0.5px',
          }}
        >
          ADMIN CONSOLE
        </span>
        <span style={{ color: '#cbd5e1', fontWeight: 300 }}>/</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          GenuAI Platform Governance
        </span>
      </div>

      {/* Center: Search */}
      <div style={{ flex: '1 1 auto', maxWidth: '380px', minWidth: '200px' }}>
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: '#f8fafc',
            color: '#64748b',
            fontSize: '12.5px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          className="hover:border-amber-400 hover:bg-white"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Search size={14} style={{ color: '#b8860b', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Search platform, logs, companies...
            </span>
          </div>
          <kbd
            style={{
              padding: '2px 6px',
              fontSize: '10.5px',
              fontWeight: 700,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              color: '#64748b',
              flexShrink: 0,
              marginLeft: '8px',
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Status pill + Help + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

        {/* Realtime Status Pill (display only — no dropdown) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 11px',
            borderRadius: '99px',
            background: rt.bg,
            color: rt.text,
            border: `1px solid ${rt.border}`,
            fontSize: '11.5px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
          title={`Realtime sync: ${rt.label}`}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: rt.dotColor,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span>{rt.label}</span>
        </div>

        {/* Help Button */}
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          style={{
            padding: '7px',
            borderRadius: '8px',
            background: '#f8fafc',
            border: '1px solid var(--border)',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          className="hover:border-amber-400"
          title="Platform Governance Protocol Guide"
        >
          <HelpCircle size={16} />
        </button>

        {/* Profile Menu (no RBAC simulator) */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              background: 'rgba(212, 175, 55, 0.08)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: '#b8860b',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {adminUser.avatar}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {adminUser.name}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#854d0e', whiteSpace: 'nowrap' }}>
                {adminUser.role}
              </div>
            </div>
            <ChevronDown size={12} style={{ color: '#854d0e', flexShrink: 0 }} />
          </button>

          {isProfileOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '200px',
                background: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
                border: '1px solid var(--border)',
                padding: '6px',
                zIndex: 60,
              }}
            >
              {/* Profile info */}
              <div
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid #f1f5f9',
                  marginBottom: '4px',
                }}
              >
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {adminUser.name}
                </div>
                <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: 600, marginTop: '1px' }}>
                  {adminUser.role}
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', wordBreak: 'break-all' }}>
                  {adminUser.email}
                </div>
              </div>

              {/* Sign Out */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#dc2626',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                className="hover:bg-red-50"
              >
                <span>Sign Out of Console</span>
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
