'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Lock,
  Bell,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function CandidateSettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifPreferences, setNotifPreferences] = useState({
    assessment_invitation: true,
    shortlist_update: true,
    interview_schedule: true,
    new_candidate_interest: true,
    vacancy_updates: true,
    product_updates: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState('');

  React.useEffect(() => {
    api.get('/auth/notification-preferences')
      .then((res) => {
        if (res.data?.preferences) {
          setNotifPreferences({
            assessment_invitation: res.data.preferences.assessment_invitation !== false,
            shortlist_update: res.data.preferences.shortlist_update !== false,
            interview_schedule: res.data.preferences.interview_schedule !== false,
            new_candidate_interest: res.data.preferences.new_candidate_interest !== false,
            vacancy_updates: res.data.preferences.vacancy_updates !== false,
            product_updates: res.data.preferences.product_updates !== false,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSavePreferences = async (updatedPrefs?: typeof notifPreferences) => {
    const toSave = updatedPrefs || notifPreferences;
    setSavingPrefs(true);
    try {
      await api.put('/auth/notification-preferences', toSave);
      setPrefsMsg('Preferences updated successfully.');
      setTimeout(() => setPrefsMsg(''), 3000);
    } catch (_) {
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    setPasswordError('');
    setPasswordMsg('');

    try {
      // In production calls password update
      await new Promise((r) => setTimeout(r, 600));
      setPasswordMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 4000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '24px 28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 99,
              background: 'rgba(212, 175, 55, 0.12)',
              fontSize: 11,
              fontWeight: 700,
              color: '#92400e',
              textTransform: 'uppercase',
            }}
          >
            Account &amp; Security
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px', color: '#0f172a' }}>
          Candidate Settings
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          Manage your account credentials, security options, and notification channels.
        </p>
      </div>

      {/* Account Info */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={18} style={{ color: 'var(--primary)' }} />
          <span>Account Identity</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>FULL NAME</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
              {user?.firstName} {user?.lastName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>REGISTERED EMAIL</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>WORKSPACE ROLE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>Verified Candidate</div>
          </div>
        </div>
      </div>

      {/* Security: Change Password */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} style={{ color: 'var(--primary)' }} />
          <span>Security & Password</span>
        </h2>

        {passwordMsg && (
          <div
            style={{
              padding: '10px 14px',
              background: '#ecfdf5',
              border: '1px solid #6ee7b7',
              borderRadius: 6,
              color: '#065f46',
              fontSize: 12.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <CheckCircle2 size={15} />
            <span>{passwordMsg}</span>
          </div>
        )}

        {passwordError && (
          <div
            style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              color: '#991b1b',
              fontSize: 12.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <AlertCircle size={15} />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Current Password
            </label>
            <input
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="btn btn-primary"
            style={{ width: 160, marginTop: 4, fontWeight: 700 }}
          >
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} style={{ color: 'var(--primary)' }} />
          <span>Notification Preferences</span>
        </h2>

        <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
          Control which non-critical transactional emails GenuAI sends to your registered address.
          Password reset, verification, and critical security alerts are always dispatched.
        </p>

        {prefsMsg && (
          <div style={{ color: '#16a34a', fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>
            ✓ {prefsMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input
              type="checkbox"
              checked={notifPreferences.assessment_invitation}
              onChange={(e) => {
                const updated = { ...notifPreferences, assessment_invitation: e.target.checked };
                setNotifPreferences(updated);
                handleSavePreferences(updated);
              }}
              style={{ width: 16, height: 16 }}
            />
            <span>Assessment Invitations (Invitations to complete competency assessments)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input
              type="checkbox"
              checked={notifPreferences.shortlist_update}
              onChange={(e) => {
                const updated = { ...notifPreferences, shortlist_update: e.target.checked };
                setNotifPreferences(updated);
                handleSavePreferences(updated);
              }}
              style={{ width: 16, height: 16 }}
            />
            <span>Shortlist Updates (Alerts when your verified evidence qualifies you for a shortlist)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input
              type="checkbox"
              checked={notifPreferences.interview_schedule}
              onChange={(e) => {
                const updated = { ...notifPreferences, interview_schedule: e.target.checked };
                setNotifPreferences(updated);
                handleSavePreferences(updated);
              }}
              style={{ width: 16, height: 16 }}
            />
            <span>Interview Schedule (Invitations and schedule changes for role interviews)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input
              type="checkbox"
              checked={notifPreferences.new_candidate_interest}
              onChange={(e) => {
                const updated = { ...notifPreferences, new_candidate_interest: e.target.checked };
                setNotifPreferences(updated);
                handleSavePreferences(updated);
              }}
              style={{ width: 16, height: 16 }}
            />
            <span>Candidate Interest Alerts (Notifications when candidates target roles)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input
              type="checkbox"
              checked={notifPreferences.vacancy_updates}
              onChange={(e) => {
                const updated = { ...notifPreferences, vacancy_updates: e.target.checked };
                setNotifPreferences(updated);
                handleSavePreferences(updated);
              }}
              style={{ width: 16, height: 16 }}
            />
            <span>Vacancy Updates (Verification approval, publishing, and status changes)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input
              type="checkbox"
              checked={notifPreferences.product_updates}
              onChange={(e) => {
                const updated = { ...notifPreferences, product_updates: e.target.checked };
                setNotifPreferences(updated);
                handleSavePreferences(updated);
              }}
              style={{ width: 16, height: 16 }}
            />
            <span>Product Updates (Announcements and new governance features)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
