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
    targetMilestones: true,
    evidenceReviews: true,
    interviewInvites: true,
    weeklyDigest: false,
  });

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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
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
            Account & Security
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
          Candidate Settings
        </h1>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input
              type="checkbox"
              checked={notifPreferences.targetMilestones}
              onChange={(e) => setNotifPreferences({ ...notifPreferences, targetMilestones: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            <span>Target status and milestone updates</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input
              type="checkbox"
              checked={notifPreferences.evidenceReviews}
              onChange={(e) => setNotifPreferences({ ...notifPreferences, evidenceReviews: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            <span>Recruiter evidence review feedback & requests for information</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input
              type="checkbox"
              checked={notifPreferences.interviewInvites}
              onChange={(e) => setNotifPreferences({ ...notifPreferences, interviewInvites: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            <span>Interview invitations & scheduling changes</span>
          </label>
        </div>
      </div>
    </div>
  );
}
