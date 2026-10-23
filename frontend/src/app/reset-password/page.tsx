'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="card text-center" style={{ maxWidth: 480, margin: '60px auto', padding: '40px 32px' }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Invalid Reset Link</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          This password reset link is invalid or has expired. Please initiate a new password reset request from the login page.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Back to Login <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to reset password. The link may have expired.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 480, margin: '60px auto', padding: '40px 32px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: 'rgba(212, 175, 55, 0.12)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <ShieldCheck size={28} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Set New Password</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Enter a strong, secure password of at least 8 characters.
        </p>
      </div>

      {success ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>Password Reset!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Your credentials have been securely updated. Redirecting to login...
          </p>
          <Link href="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Go to Login <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#f87171',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                style={{ paddingLeft: 40, paddingRight: 40, width: '100%' }}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                style={{ paddingLeft: 40, width: '100%' }}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, height: 44, fontWeight: 700 }}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
              Return to Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
