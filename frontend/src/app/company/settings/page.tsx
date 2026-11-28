'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Lock, User, Building2, ChevronRight, Shield,
  ShieldCheck, Plus, CheckCircle2, Trash2, UserX, UserCheck, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

const TABS = ['Account', 'Team & RBAC', 'Notifications', 'Privacy & Data'];

const NOTIFICATIONS = [
  { label: 'Candidate assessment completed', desc: 'When a candidate finishes the official assessment', enabled: true },
  { label: 'Interview scheduled', desc: 'When a new interview is booked', enabled: true },
  { label: 'Evidence gap detected', desc: 'When a candidate has uncovered requirements', enabled: true },
  { label: 'Integrity signal raised', desc: 'When monitoring signals are detected', enabled: true },
  { label: 'Application updates', desc: 'When candidates apply or withdraw', enabled: false },
  { label: 'Vacancy status change', desc: 'When admin verifies or rejects a vacancy', enabled: true },
];

interface TeamMember {
  member_id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  member_role: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const { user, company } = useAuth();
  const [tab, setTab] = useState('Account');
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    memberRole: 'COMPANY_RECRUITER',
    password: '',
  });
  const [inviting, setInviting] = useState(false);
  const [lastTempPassword, setLastTempPassword] = useState<string | null>(null);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const userEmail = user?.email ?? '';
  const companyName = company?.name ?? '';

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await api.get('/company/members');
      setMembers(res.data?.members || []);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'Team & RBAC') {
      loadMembers();
    }
  }, [tab, loadMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    setInviting(true);
    try {
      const res = await api.post('/company/members/invite', inviteForm);
      toast.success('Team member invited');
      setLastTempPassword(res.data?.temporaryPassword || null);
      setInviteForm({ email: '', firstName: '', lastName: '', memberRole: 'COMPANY_RECRUITER', password: '' });
      setShowInvite(false);
      await loadMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to invite team member');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, memberRole: string) => {
    try {
      await api.patch(`/company/members/${memberId}/role`, { memberRole });
      toast.success('Role updated');
      await loadMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not update role');
    }
  };

  const handleStatusToggle = async (memberId: string, isActive: boolean) => {
    try {
      await api.patch(`/company/members/${memberId}/status`, { isActive });
      toast.success(isActive ? 'Member activated' : 'Member deactivated');
      await loadMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not update member status');
    }
  };

  const handleRemove = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from your company workspace?`)) return;
    try {
      await api.delete(`/company/members/${memberId}`);
      toast.success('Team member removed');
      await loadMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not remove team member');
    }
  };

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
              <input className="form-input" defaultValue={companyName} placeholder="Your company name" readOnly />
            </div>
            <p className="text-xs text-slate-500">
              Update official company verification details from the Company Profile page.
            </p>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Signed-In Account</div>
              <User size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={fullName} readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input className="form-input" value={userEmail} type="email" readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-input" value={user?.role || 'COMPANY_OWNER'} readOnly />
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
                <strong> COMPANY_OWNER</strong> manages team members, company profile, checklist lock, and vacancy publish.{' '}
                <strong>COMPANY_RECRUITER</strong> manages candidate evaluations, skill checklists, shortlists, overrides, and outcomes.
              </div>
            </div>
          </div>

          {lastTempPassword && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4 text-xs text-amber-950">
              <div>
                <strong>Temporary sign-in password generated:</strong>{' '}
                <code className="px-2 py-0.5 bg-white rounded border border-amber-200 font-mono">{lastTempPassword}</code>
                {' '}(Share securely with the invited recruiter.)
              </div>
              <button className="btn btn-secondary btn-xs" onClick={() => setLastTempPassword(null)}>
                <X size={12} /> Dismiss
              </button>
            </div>
          )}

          {showInvite && (
            <form onSubmit={handleInvite} className="card space-y-4">
              <div className="card-header">
                <h3 className="card-title">Invite Team Member</h3>
                <button type="button" className="btn btn-secondary btn-xs" onClick={() => setShowInvite(false)}>
                  <X size={13} /> Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Work Email *</label>
                  <input
                    className="form-input"
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="recruiter@company.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    value={inviteForm.memberRole}
                    onChange={e => setInviteForm({ ...inviteForm, memberRole: e.target.value })}
                  >
                    <option value="COMPANY_RECRUITER">COMPANY_RECRUITER (Recruiter)</option>
                    <option value="COMPANY_OWNER">COMPANY_OWNER (Full Admin)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    className="form-input"
                    value={inviteForm.firstName}
                    onChange={e => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    className="form-input"
                    value={inviteForm.lastName}
                    onChange={e => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" disabled={inviting} className="btn btn-gold btn-sm">
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          )}

          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Team Access &amp; RBAC Roles</h2>
                <p className="card-subtitle">
                  Active team members in {companyName || 'your organization'}.
                </p>
              </div>
              <button className="btn btn-gold btn-sm" onClick={() => setShowInvite(true)}>
                <Plus size={14} /> Invite Team Member
              </button>
            </div>

            {loadingMembers ? (
              <div className="p-6 text-center text-xs text-slate-500">Loading company team members...</div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No team members found yet.</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const name = `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email;
                      const isSelf = m.user_id === user?.id;
                      const isOwner = ['COMPANY_OWNER', 'COMPANY_ADMIN', 'ADMIN'].includes((m.member_role || '').toUpperCase());
                      return (
                        <tr key={m.member_id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div
                                style={{
                                  width: 32, height: 32, borderRadius: '50%',
                                  background: '#fefce8', border: '1px solid rgba(212,175,55,0.4)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 700, color: '#a16207',
                                }}
                              >
                                {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{name} {isSelf && '(You)'}</div>
                                <div className="text-[11px] text-slate-500">{m.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <select
                              className="form-select text-xs"
                              style={{ height: 30, padding: '2px 8px', width: 175 }}
                              value={isOwner ? 'COMPANY_OWNER' : 'COMPANY_RECRUITER'}
                              disabled={isSelf}
                              onChange={e => handleRoleChange(m.member_id, e.target.value)}
                            >
                              <option value="COMPANY_OWNER">COMPANY_OWNER</option>
                              <option value="COMPANY_RECRUITER">COMPANY_RECRUITER</option>
                            </select>
                          </td>
                          <td>
                            <span className={`badge ${m.is_active ? 'badge-green' : 'badge-gray'} text-[10px] font-bold`}>
                              <CheckCircle2 size={10} /> {m.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex justify-end gap-2">
                              <button
                                className="btn btn-secondary btn-xs"
                                disabled={isSelf}
                                onClick={() => handleStatusToggle(m.member_id, !m.is_active)}
                                title={m.is_active ? 'Deactivate member' : 'Activate member'}
                              >
                                {m.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                                {m.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                className="btn btn-secondary btn-xs"
                                disabled={isSelf}
                                style={{ color: '#dc2626' }}
                                onClick={() => handleRemove(m.member_id, m.email)}
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
              <h2 className="card-title">Data Privacy &amp; Governance</h2>
              <p className="card-subtitle">Configure data isolation, consent retention policies, and export capabilities.</p>
            </div>
            <Shield size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { title: 'Candidate Data Access Control', desc: 'Restrict assessment transcripts and telemetry to authorized recruiters only', action: 'Manage Access' },
              { title: 'Cross-Company Role Intelligence Permission', desc: 'Allow non-confidential requirement metadata to contribute to aggregated role profiles', action: 'Review Agreement' },
              { title: 'Data Retention & Purging', desc: 'Retain candidate evaluation data for 180 days post-hiring cycle completion', action: 'Configure Policy' },
              { title: 'Cryptographic Audit Trail Export', desc: 'View timestamped recruiter decisions and verification audit logs', action: 'View Audit Log', href: '/company/audit' },
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
                {item.href ? (
                  <a href={item.href} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                    {item.action} <ChevronRight size={12} />
                  </a>
                ) : (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => toast.success(`${item.title} policy active`)}
                  >
                    {item.action}
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
