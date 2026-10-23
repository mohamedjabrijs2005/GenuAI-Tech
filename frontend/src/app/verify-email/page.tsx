'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    let isMounted = true;
    api.post('/auth/verify-email', { token })
      .then((res) => {
        if (!isMounted) return;
        setStatus('success');
        setMessage(res.data?.message || 'Email verified successfully!');
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification link expired or invalid.');
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="card text-center" style={{ maxWidth: 480, margin: '60px auto', padding: '40px 32px' }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: status === 'success' ? 'rgba(34, 197, 94, 0.12)' : status === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(212, 175, 55, 0.12)',
        border: `1px solid ${status === 'success' ? 'rgba(34, 197, 94, 0.3)' : status === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(212, 175, 55, 0.3)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        {status === 'verifying' && <Loader2 size={28} color="var(--primary)" className="animate-spin" />}
        {status === 'success' && <CheckCircle2 size={28} color="#22c55e" />}
        {status === 'error' && <AlertCircle size={28} color="#ef4444" />}
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
        {status === 'verifying' && 'Verifying Email'}
        {status === 'success' && 'Email Verified!'}
        {status === 'error' && 'Verification Failed'}
      </h2>

      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
        {message}
      </p>

      {status === 'success' && (
        <Link href="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px' }}>
          Continue to Login <ArrowRight size={16} />
        </Link>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/login" className="btn btn-secondary">
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
