'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Shield,
  Info,
} from 'lucide-react';
import api from '@/lib/api';

export default function CandidateNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    api
      .get('/candidate-portal/notifications')
      .then((res) => {
        setNotifications(res.data?.notifications || []);
      })
      .catch((err) => {
        console.error('Failed to load notifications:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/candidate-portal/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (_) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/candidate-portal/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (_) {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: 'rgba(212, 175, 55, 0.2)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fef08a',
                  textTransform: 'uppercase',
                }}
              >
                In-App Notification Stream
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0' }}>Notifications</h1>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          System & Milestone Updates
        </h2>

        {notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 8,
                  background: n.is_read ? '#fafaf9' : '#fffdf7',
                  border: n.is_read ? '1px solid var(--border)' : '1px solid rgba(212, 175, 55, 0.4)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {!n.is_read && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#d4af37',
                          display: 'inline-block',
                        }}
                      />
                    )}
                    <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {n.title}
                    </h3>
                  </div>

                  <p style={{ fontSize: 13, color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>
                    {n.message}
                  </p>

                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => handleMarkAsRead(n.id)}
                      className="btn btn-primary"
                      style={{ fontSize: 11.5, padding: '4px 10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>View</span>
                      <ArrowRight size={12} />
                    </Link>
                  )}
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer' }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
            <Bell size={32} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>No Notifications</div>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0' }}>
              Target milestones and recruiter updates will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
