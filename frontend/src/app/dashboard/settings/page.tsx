'use client';
import { useState } from 'react';
import { Bell, Lock, User, Building2, ChevronRight } from 'lucide-react';

const TABS = ['Account', 'Notifications', 'Privacy & Data'];

const NOTIFICATIONS = [
  { label: 'Candidate assessment completed', desc: 'When a candidate finishes the official assessment', enabled: true },
  { label: 'Interview scheduled', desc: 'When a new interview is booked', enabled: true },
  { label: 'Evidence gap detected', desc: 'When a candidate has uncovered requirements', enabled: true },
  { label: 'Integrity signal raised', desc: 'When monitoring signals are detected', enabled: true },
  { label: 'Application updates', desc: 'When candidates apply or withdraw', enabled: false },
  { label: 'Vacancy status change', desc: 'When admin verifies or rejects a vacancy', enabled: true },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('Account');
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const toggle = (i: number) => setNotifs(prev => prev.map((n, idx) => idx === i ? { ...n, enabled: !n.enabled } : n));

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your company account, notifications, and data preferences</p>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Account' && (
        <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Company Information</div>
              <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" defaultValue="Acme Technologies Ltd." />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <input className="form-input" defaultValue="Technology" />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" defaultValue="https://acme.example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Company Size</label>
              <select className="form-select" defaultValue="50-200">
                <option>1-10</option>
                <option>11-50</option>
                <option value="50-200">50-200</option>
                <option>200-1000</option>
                <option>1000+</option>
              </select>
            </div>
            <button className="btn btn-primary w-full">Save Changes</button>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title">Recruiter Account</div>
                <User size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" defaultValue="Sarah Connor" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" defaultValue="sarah@genuai.com" type="email" />
              </div>
              <button className="btn btn-secondary w-full">Update Profile</button>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Security</div>
                <Lock size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" placeholder="••••••••" />
              </div>
              <button className="btn btn-secondary w-full">Change Password</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'Notifications' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header">
            <div className="card-title">Notification Preferences</div>
            <Bell size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {notifs.map((n, i) => (
              <div key={n.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '14px 0', borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13.5, marginBottom: 2 }}>{n.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.desc}</div>
                </div>
                <button
                  onClick={() => toggle(i)}
                  aria-checked={n.enabled}
                  role="switch"
                  aria-label={`Toggle ${n.label}`}
                  style={{
                    width: 40, height: 22, borderRadius: 99,
                    background: n.enabled ? 'var(--brand)' : 'var(--surface-3)',
                    border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                    transition: 'background var(--t)',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3,
                    left: n.enabled ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left var(--t)',
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Privacy & Data' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header">
            <div className="card-title">Data & Privacy</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { title: 'Candidate Data Access', desc: 'View and manage access to candidate profiles and results', action: 'Manage' },
              { title: 'Result Sharing', desc: 'Configure who can view assessment results within your team', action: 'Configure' },
              { title: 'Data Retention', desc: 'Set how long candidate data is retained after a vacancy closes', action: 'Set Policy' },
              { title: 'Consent & Agreements', desc: 'View signed platform agreements and candidate consents', action: 'View' },
              { title: 'Export Data', desc: 'Export your company data in CSV or JSON format', action: 'Export' },
            ].map((item) => (
              <div key={item.title} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13.5, marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                  {item.action}
                  <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
