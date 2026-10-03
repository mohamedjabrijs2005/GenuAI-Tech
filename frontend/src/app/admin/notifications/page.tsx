'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Building2,
  Briefcase,
  Gavel,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import { adminDataService, AdminNotification } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>(adminDataService.getNotifications());
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const refresh = () => {
    setNotifications(adminDataService.getNotifications());
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleMarkAllRead = () => {
    adminDataService.markAllNotificationsAsRead();
    toast.success('All notifications marked as read.');
  };

  const handleMarkRead = (id: string) => {
    adminDataService.markNotificationAsRead(id);
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'company_verification':
        return <Building2 size={16} style={{ color: '#b8860b' }} />;
      case 'vacancy_submitted':
        return <Briefcase size={16} style={{ color: '#854d0e' }} />;
      case 'integrity_incident':
      case 'security_incident':
        return <ShieldAlert size={16} style={{ color: '#dc2626' }} />;
      case 'dispute_opened':
        return <Gavel size={16} style={{ color: '#7e22ce' }} />;
      default:
        return <Bell size={16} style={{ color: '#64748b' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Platform Governance Notifications
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#854d0e',
              }}
            >
              Realtime Event Stream
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Real-time critical operational alerts requiring administrative verification, governance review, or incident arbitration.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setFilter('ALL')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                background: filter === 'ALL' ? '#ffffff' : 'transparent',
                color: filter === 'ALL' ? 'var(--text-primary)' : '#64748b',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: filter === 'ALL' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                background: filter === 'UNREAD' ? '#ffffff' : 'transparent',
                color: filter === 'UNREAD' ? 'var(--text-primary)' : '#64748b',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: filter === 'UNREAD' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          <button
            onClick={handleMarkAllRead}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCheck size={14} /> Mark All Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px' }}>
            No notifications matching this filter.
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif.id)}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: notif.read ? '#ffffff' : 'rgba(212, 175, 55, 0.04)',
                borderLeft: notif.read ? '3px solid transparent' : '3px solid #b8860b',
                transition: 'background 0.15s ease',
              }}
              className="hover:bg-slate-50"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, marginRight: '16px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: notif.read ? '#f8fafc' : 'rgba(212, 175, 55, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getIcon(notif.type)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: notif.read ? 600 : 800, color: 'var(--text-primary)' }}>
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b8860b' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '3px 0 0', lineHeight: 1.4 }}>
                    {notif.message}
                  </p>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    {notif.timestamp}
                  </div>
                </div>
              </div>

              <Link
                href={notif.link}
                onClick={() => handleMarkRead(notif.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#854d0e',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
                className="hover:bg-amber-50 hover:border-amber-300"
              >
                <span>Take Action</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
