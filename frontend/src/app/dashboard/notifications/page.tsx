'use client';

import { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, UserCheck, ShieldCheck, Sparkles, Clock, Trash2 } from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Candidate Assessment Completed',
    desc: 'Mohamed Jabri completed the Java & Data Structures VIVA assessment with 94% coverage.',
    time: '5 minutes ago',
    type: 'success',
    unread: true,
  },
  {
    id: 2,
    title: 'Proctor Integrity Alert Flagged',
    desc: 'Aisha Rahman had 2 tab-switch events logged during the timed technical assessment.',
    time: '2 hours ago',
    type: 'warning',
    unread: true,
  },
  {
    id: 3,
    title: 'New Candidate Applied',
    desc: 'James Okonkwo applied for Senior Software Developer role and was verified eligible by system rules.',
    time: '5 hours ago',
    type: 'info',
    unread: false,
  },
  {
    id: 4,
    title: 'Vacancy Approved & Published',
    desc: 'Senior DevOps Specialist vacancy was reviewed and approved by GenuAI Verification Admin.',
    time: '1 day ago',
    type: 'gold',
    unread: false,
  },
];

export default function NotificationsPage() {
  const [list, setList] = useState(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setList(list.map(n => ({ ...n, unread: false })));
  };

  const clearNotification = (id: number) => {
    setList(list.filter(n => n.id !== id));
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Platform</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Notifications</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Live Notifications &amp; Alerts
            </h1>
            <p className="page-subtitle">
              Live stream of assessment completions, integrity flags, and candidate pipeline updates.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={markAllRead}>
            <CheckCircle2 size={16} />
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Notifications Container */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Activity Stream</div>
            <div className="card-subtitle">Showing recent real-time system events</div>
          </div>
          <span className="badge badge-gold font-semibold">
            {list.filter(n => n.unread).length} Unread
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {list.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Bell /></div>
              <div className="empty-title">All caught up!</div>
              <div className="empty-desc">No active notifications at this time.</div>
            </div>
          ) : (
            list.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 18px',
                  borderRadius: 'var(--r-lg)',
                  background: item.unread ? '#fefce8' : '#ffffff',
                  border: item.unread ? '1px solid rgba(212,175,55,0.4)' : '1px solid var(--border)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: item.type === 'gold' ? '#fef3c7' : item.type === 'warning' ? '#fffbeb' : '#ecfdf5',
                    color: item.type === 'gold' ? '#92400e' : item.type === 'warning' ? '#d97706' : '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {item.type === 'warning' ? <AlertTriangle size={18} /> : item.type === 'gold' ? <Sparkles size={18} /> : <CheckCircle2 size={18} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2">
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    {item.unread && (
                      <span className="gold-badge" style={{ fontSize: 9 }}>NEW</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {item.desc}
                  </p>
                  <div className="flex items-center gap-2 mt-2" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    <span>{item.time}</span>
                  </div>
                </div>

                {/* Clear button */}
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ width: 30, height: 30 }}
                  onClick={() => clearNotification(item.id)}
                  title="Dismiss notification"
                >
                  <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
