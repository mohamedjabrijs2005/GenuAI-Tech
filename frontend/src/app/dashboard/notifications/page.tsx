'use client';

import { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, AlertTriangle, Briefcase, Users, Calendar,
  Shield, FileCheck, Check, Trash2, Filter, X, ChevronRight, RefreshCw, Info
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'candidate_applied', title: 'New Application Received', message: 'Carlos Mendez applied for Senior Software Developer.', read: false, entity_type: 'application', entity_id: 'a3', created_at: '2026-10-01T17:45:00Z' },
  { id: 'n2', type: 'assessment_completed', title: 'Assessment Completed', message: 'Priya Sharma completed the Technical Assessment with a score of 91%.', read: false, entity_type: 'application', entity_id: 'a2', created_at: '2026-10-01T15:30:00Z' },
  { id: 'n3', type: 'integrity_flag', title: 'Integrity Signal Flagged', message: 'A tab-switch event was detected for James Okonkwo\'s assessment session.', read: false, entity_type: 'integrity', entity_id: 'sig-001', created_at: '2026-10-01T14:10:00Z' },
  { id: 'n4', type: 'interview_scheduled', title: 'Interview Scheduled', message: 'Interview with Alex Rivera is confirmed for 5th Oct 2026 at 10:00 AM.', read: true, entity_type: 'interview', entity_id: 'int-001', created_at: '2026-10-01T11:00:00Z' },
  { id: 'n5', type: 'vacancy_verified', title: 'Vacancy Approved by GenuAI', message: 'Your vacancy "Senior Software Developer" has been verified and is now live.', read: true, entity_type: 'vacancy', entity_id: '1', created_at: '2026-09-30T16:30:00Z' },
  { id: 'n6', type: 'evidence_gap', title: 'Evidence Gap Detected', message: 'Carlos Mendez has insufficient evidence for "AWS Cloud Architecture" requirement.', read: true, entity_type: 'evidence', entity_id: 'ev-001', created_at: '2026-09-30T14:00:00Z' },
  { id: 'n7', type: 'assessment_completed', title: 'Assessment Completed', message: 'Alex Rivera completed the Technical Assessment with a score of 84%.', read: true, entity_type: 'application', entity_id: 'a1', created_at: '2026-09-29T17:45:00Z' },
  { id: 'n8', type: 'candidate_applied', title: 'New Application Received', message: 'Sara Kim applied for Product Designer.', read: true, entity_type: 'application', entity_id: 'a4', created_at: '2026-09-28T09:30:00Z' },
];

const NOTIF_ICON: Record<string, React.ReactNode> = {
  candidate_applied: <Users size={16} style={{ color: '#2563eb' }} />,
  assessment_completed: <CheckCircle2 size={16} style={{ color: '#059669' }} />,
  integrity_flag: <AlertTriangle size={16} style={{ color: '#d97706' }} />,
  interview_scheduled: <Calendar size={16} style={{ color: '#7c3aed' }} />,
  vacancy_verified: <Shield size={16} style={{ color: '#d4af37' }} />,
  evidence_gap: <FileCheck size={16} style={{ color: '#dc2626' }} />,
};

const NOTIF_BG: Record<string, string> = {
  candidate_applied: 'rgba(37,99,235,0.08)',
  assessment_completed: 'rgba(5,150,105,0.08)',
  integrity_flag: 'rgba(217,119,6,0.1)',
  interview_scheduled: 'rgba(124,58,237,0.08)',
  vacancy_verified: 'rgba(212,175,55,0.1)',
  evidence_gap: 'rgba(220,38,38,0.08)',
};

const NOTIF_LINK: Record<string, string> = {
  application: '/dashboard/candidates',
  vacancy: '/dashboard/vacancies',
  interview: '/dashboard/interviews',
  integrity: '/dashboard/integrity',
  evidence: '/dashboard/evidence',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    api.get('/reports/notifications')
      .then(r => { if (r.data.notifications?.length) setNotifs(r.data.notifications); })
      .catch(() => {});
  }, []);

  const filtered = filter === 'unread' ? notifs.filter(n => !n.read) : notifs;
  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    api.patch(`/reports/notifications/${id}/read`).catch(() => {});
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 className="page-title">Notifications</h1>
              {unreadCount > 0 && (
                <span style={{ background: 'var(--danger)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 20, minWidth: 24, textAlign: 'center' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="page-subtitle">Real-time updates on candidates, assessments, interviews, and platform events.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={markAllRead} className="btn btn-secondary btn-sm" disabled={unreadCount === 0}>
              <Check size={14} /> Mark all read
            </button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-gold' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}>
            {f === 'all' ? `All (${notifs.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><Bell size={22} /></div>
            <div className="empty-title">No {filter === 'unread' ? 'unread ' : ''}notifications</div>
            <div className="empty-desc">You're all caught up! Check back later for updates.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(notif => (
          <div
            key={notif.id}
            className="card"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              border: notif.read ? '1px solid var(--border)' : '1px solid rgba(30,58,138,0.3)',
              background: notif.read ? 'var(--white)' : 'var(--surface-container-low)',
              transition: 'all 0.2s',
            }}
          >
            {/* Icon */}
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: NOTIF_BG[notif.type] || 'var(--surface-container)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {NOTIF_ICON[notif.type] || <Info size={16} />}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ fontWeight: notif.read ? 600 : 800, fontSize: 13.5, color: 'var(--text-primary)' }}>
                  {notif.title}
                </div>
                {!notif.read && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-light)', flexShrink: 0 }} />
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{notif.message}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                {timeAgo(notif.created_at)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
              {notif.entity_type && (
                <Link
                  href={`${NOTIF_LINK[notif.entity_type] || '/dashboard'}/${notif.entity_id || ''}`}
                  className="btn btn-secondary btn-sm"
                  onClick={() => markRead(notif.id)}
                >
                  View <ChevronRight size={13} />
                </Link>
              )}
              {!notif.read && (
                <button onClick={() => markRead(notif.id)} className="btn btn-ghost btn-sm btn-icon" title="Mark as read">
                  <Check size={14} />
                </button>
              )}
              <button onClick={() => dismiss(notif.id)} className="btn btn-ghost btn-sm btn-icon" title="Dismiss">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preferences Card */}
      <div className="card" style={{ marginTop: 24, padding: 20 }}>
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div className="card-title">Notification Preferences</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'New candidate applications', desc: 'When a candidate applies to one of your vacancies', enabled: true },
            { label: 'Assessment completed', desc: 'When a candidate finishes an official assessment', enabled: true },
            { label: 'Integrity signals', desc: 'When a proctoring flag is generated', enabled: true },
            { label: 'Interview scheduled/cancelled', desc: 'When interviews are created or changed', enabled: true },
            { label: 'Vacancy verified by GenuAI Admin', desc: 'When your vacancy is reviewed and approved', enabled: true },
            { label: 'Evidence gap alerts', desc: 'When a candidate lacks evidence for a requirement', enabled: false },
          ].map(pref => (
            <div key={pref.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--surface-container-low)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{pref.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pref.desc}</div>
              </div>
              <label style={{ position: 'relative', width: 40, height: 22, flexShrink: 0 }}>
                <input type="checkbox" defaultChecked={pref.enabled} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: 11,
                  background: pref.enabled ? 'var(--gold-primary)' : 'var(--border)',
                  cursor: 'pointer', transition: 'background 0.2s',
                }} />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
