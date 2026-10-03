'use client';

import { useState } from 'react';
import {
  Bell, Lock, User, Building2, ChevronRight, Shield,
  ShieldCheck, Plus, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const TABS = ['Account', 'Team & RBAC', 'Notifications', 'Privacy & Data'];

const NOTIFICATIONS = [
  { label: 'Candidate assessment completed', desc: 'When a candidate finishes the official assessment', enabled: true },
  { label: 'Interview scheduled', desc: 'When a new interview is booked', enabled: true },
  { label: 'Evidence gap detected', desc: 'When a candidate has uncovered requirements', enabled: true },
  { label: 'Integrity signal raised', desc: 'When monitoring signals are detected', enabled: true },
  { label: 'Application updates', desc: 'When candidates apply or withdraw', enabled: false },
  { label: 'Vacancy status change', desc: 'When admin verifies or rejects a vacancy', enabled: true },
];

const OTHER_TEAM_MEMBERS = [
  {
    name: 'David Park',
    email: 'david.park@company.example',
    role: 'Recruiter',
    assignedVacancies: 'Software Developer, Senior DevOps',
    status: 'Active',
  },
  {
    name: 'David Kim',
    email: 'david.kim@company.example',
    role: 'Interviewer',
    assignedVacancies: 'Software Developer (Round 1 & 2)',
    status: 'Active',
  },
  {
    name: 'Lisa Chen',
    email: 'lisa.chen@company.example',
    role: 'Interviewer',
    assignedVacancies: 'Product Designer',
    status: 'Active',
  },
];

export default function SettingsPage() {
  const { user, company } = useAuth();
  const [tab, setTab] = useState('Account');
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const userEmail = user?.email ?? '';
  const companyName = company?.name ?? '';

  const teamMembers = [
    ...(user ? [{
      name: fullName || 'You',
      email: userEmail,
      role: 'Company Admin',
      assignedVacancies: 'All Vacancies (Full Company Access)',
      status: 'Active',
    }] : []),
    ...OTHER_TEAM_MEMBERS,
  ];

  const toggle = (i: number) => {
    setNotifs(prev => prev.map((n, idx) => idx === i ? { ...n, enabled: !n.enabled } : n));
    toast.success('Notification preference updated');
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Platform</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Settings & Preferences</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Settings & Governance</h1>
            <p className="page-subtitle">Manage corporate account, RBAC permissions, notifications, and tenant privacy.</p>
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
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
              <input className="form-input" defaultValue={companyName} placeholder="Your company name" />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <input className="form-input" defaultValue="" placeholder="e.g. Enterprise Software & AI" />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" defaultValue="" placeholder="https://yourcompany.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Company Size</label>
              <select className="form-select" defaultValue="">
                <option value="">Select size...</option>
                <option>1-10</option>
                <option>11-50</option>
                <option>50-200 employees</option>
                <option>200-1000</option>
                <option>1000+</option>
              </select>
            </div>
            <button className="btn btn-gold w-full" onClick={() => toast.success('Company info saved')}>
              Save Changes
            </button>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title">Recruiter Account</div>
                <User size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" defaultValue={fullName} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Work Email</label>
                <input className="form-input" defaultValue={userEmail} type="email" placeholder="your@email.com" />
              </div>
              <button className="btn btn-secondary w-full" onClick={() => toast.success('Profile updated')}>
                Update Profile
              </button>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Security & Credentials</div>
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
              <button className="btn btn-secondary w-full" onClick={() => toast.success('Password updated')}>
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'Team & RBAC' && (
        <div className="space-y-6">
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--r-lg)', padding: '14px 18px' }}>
            <div className="flex items-start gap-3 text-xs text-emerald-900">
              <ShieldCheck size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
              <div className="leading-relaxed">
                <strong>Organization Tenant Isolation Enforced:</strong>{' '}
                {companyName || 'Your company'} is assigned an isolated workspace.
                Company data, candidate evaluations, and assessment banks are fully separated between tenants.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Team Access & RBAC Roles</h2>
                <p className="card-subtitle">
                  Define permissions: Company Admin (Full access), Recruiter (Assigned vacancies & evidence), Interviewer (Assigned interviews & rubric evaluation).
                </p>
              </div>
              <button className="btn btn-gold btn-sm" onClick={() => toast('Invite modal would open here')}>
                <Plus size={14} /> Invite Team Member
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Assigned Vacancies</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m) => (
                    <tr key={m.email}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: '#fefce8', border: '1px solid rgba(212,175,55,0.4)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: '#a16207'
                            }}
                          >
                            {m.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{m.name}</div>
                            <div className="text-[11px] text-slate-500">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          m.role === 'Company Admin' ? 'badge-yellow' : m.role === 'Recruiter' ? 'badge-blue' : 'badge-gray'
                        } text-[11px] font-bold`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="text-xs text-slate-600 font-medium">{m.assignedVacancies}</td>
                      <td>
                        <span className="badge badge-green text-[10px] font-bold">
                          <CheckCircle2 size={10} /> {m.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => toast(`Editing permissions for ${m.name}`)}>
                          Edit Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'Notifications' && (
        <div className="card" style={{ maxWidth: 680 }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Notification Triggers</h2>
              <p className="card-subtitle">Real-time alerts for recruitment milestones and integrity monitoring.</p>
            </div>
            <Bell size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {notifs.map((n, i) => (
              <div key={n.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '14px 0', borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2, color: 'var(--text-primary)' }}>{n.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.desc}</div>
                </div>
                <button
                  onClick={() => toggle(i)}
                  aria-checked={n.enabled}
                  role="switch"
                  aria-label={`Toggle ${n.label}`}
                  style={{
                    width: 40, height: 22, borderRadius: 99,
                    background: n.enabled ? '#d4af37' : 'var(--surface-3)',
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
        <div className="card" style={{ maxWidth: 680 }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Data Privacy & Governance</h2>
              <p className="card-subtitle">Configure data isolation, consent retention policies, and export capabilities.</p>
            </div>
            <Shield size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { title: 'Candidate Data Access Control', desc: 'Restrict assessment transcripts and telemetry to authorized recruiters only', action: 'Manage Access' },
              { title: 'Cross-Company Role Intelligence Permission', desc: 'Permission B: Allow non-confidential requirement metadata to contribute to aggregated role profiles', action: 'Review Agreement' },
              { title: 'Data Retention & Purging', desc: 'Retain candidate evaluation data for 180 days post-hiring cycle completion', action: 'Configure Policy' },
              { title: 'Cryptographic Audit Trail Export', desc: 'Export full SHA-256 evidence ledgers and timestamped recruiter decisions', action: 'Export Audit Log' },
              { title: 'Tenant Isolation Verification', desc: 'Verify PostgreSQL schema separation and row-level tenant barriers', action: 'Verify Tenant ID' },
            ].map((item) => (
              <div key={item.title} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2, color: 'var(--text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flexShrink: 0 }}
                  onClick={() => toast(`Action: ${item.action}`)}
                >
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
