'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  Building2,
  Layers,
  Info,
  Edit3,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface PrivacyRequest {
  id: string;
  request_type: 'export' | 'deletion' | 'correction' | string;
  status: 'pending' | 'in_review' | 'completed' | 'rejected' | string;
  reason?: string | null;
  created_at: string;
}

export default function CandidatePrivacyPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/candidate-portal/privacy-requests');
      setRequests(res.data?.requests || []);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleExport = async () => {
    setSubmitting('export');
    try {
      await api.post('/candidate-portal/privacy-requests', { requestType: 'export' });
      const res = await api.get('/candidate-portal/privacy-export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `genuai-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data export downloaded and logged');
      await loadRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to export data');
    } finally {
      setSubmitting(null);
    }
  };

  const handleRequest = async (requestType: 'deletion' | 'correction', reason?: string) => {
    setSubmitting(requestType);
    try {
      await api.post('/candidate-portal/privacy-requests', { requestType, reason: reason || null });
      toast.success(`${requestType === 'deletion' ? 'Deletion' : 'Correction'} request submitted`);
      if (requestType === 'correction') setCorrectionText('');
      await loadRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit privacy request');
    } finally {
      setSubmitting(null);
    }
  };

  const hasPendingDeletion = requests.some((r) => r.request_type === 'deletion' && (r.status === 'pending' || r.status === 'in_review'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
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
              background: 'rgba(5, 150, 105, 0.1)',
              fontSize: 11,
              fontWeight: 700,
              color: '#065f46',
              textTransform: 'uppercase',
            }}
          >
            Privacy &amp; Tenant Isolation Architecture
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px', color: '#0f172a' }}>
          Privacy, Data Separation &amp; Control Center
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, maxWidth: 650 }}>
          Understand your privacy boundaries, company data separation, and control your personal recruitment records.
        </p>
      </div>

      {/* Mandatory Multi-Target Separation Statement */}
      <div
        style={{
          padding: '20px 24px',
          background: '#f0fdf4',
          borderRadius: 12,
          border: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}
      >
        <Shield size={24} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#166534', margin: '0 0 6px' }}>
            Multi-Target Data Isolation Guarantee
          </h2>
          <p style={{ fontSize: 13, color: '#15803d', lineHeight: 1.6, margin: 0 }}>
            Companies can see only information connected to your target for their vacancy. Your target data for one company is not automatically shared with another company.
          </p>
        </div>
      </div>

      {/* Isolation Visual Breakdown */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          How GenuAI Protects Your Boundaries
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16 }}>
          <div style={{ padding: '16px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--primary)' }}>
              <Building2 size={18} />
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Target for Company A</h3>
            </div>
            <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, margin: 0 }}>
              Company A can review only evidence submitted for Company A&apos;s vacancy. They cannot see your application status with Company B.
            </p>
          </div>

          <div style={{ padding: '16px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--primary)' }}>
              <Building2 size={18} />
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Target for Company B</h3>
            </div>
            <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, margin: 0 }}>
              Company B has strictly isolated access. No assessment scores, reviewer feedback, or evidence from other employers leak.
            </p>
          </div>

          <div style={{ padding: '16px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#059669' }}>
              <Lock size={18} />
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Practice Sandbox</h3>
            </div>
            <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, margin: 0 }}>
              Practice quizzes and self-check exercises are strictly private to you. They are never transmitted to employers.
            </p>
          </div>
        </div>
      </div>

      {/* Data Export & Account Control */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Personal Data Rights & Account Management
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Export Request */}
          <div
            className="flex-mobile-col"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: 8,
              background: '#fafaf9',
              border: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                Download Personal Workspace Data
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Receive an encrypted archive of your profile, target history, and submitted evidence hashes.
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={submitting !== null}
              className="btn btn-secondary btn-mobile-full"
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} />
              <span>{submitting === 'export' ? 'Exporting...' : 'Download Data Export'}</span>
            </button>
          </div>

          {/* Correction Request */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: '14px 18px',
              borderRadius: 8,
              background: '#fafaf9',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                Request Data Correction
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Submit a correction request for inaccurate profile, claim, or application metadata.
              </div>
            </div>
            <div className="flex-mobile-col" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                placeholder="Describe what needs to be corrected..."
                className="form-input mobile-full"
                style={{ flex: 1, minWidth: 'min(100%, 220px)', minHeight: 44, fontSize: 12.5 }}
              />
              <button
                type="button"
                disabled={submitting !== null || !correctionText.trim()}
                onClick={() => handleRequest('correction', correctionText.trim())}
                className="btn btn-secondary btn-mobile-full"
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Edit3 size={14} />
                <span>{submitting === 'correction' ? 'Submitting...' : 'Submit Correction'}</span>
              </button>
            </div>
          </div>

          {/* Account Deletion */}
          <div
            className="flex-mobile-col"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: 8,
              background: '#fafaf9',
              border: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#ef4444' }}>
                Account Deactivation / Erasure
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Request permanent deactivation and deletion of your profile and personal evidence files.
              </div>
            </div>

            {hasPendingDeletion ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
                Deactivation Request Pending
              </span>
            ) : (
              <button
                type="button"
                disabled={submitting !== null}
                onClick={() => handleRequest('deletion', 'Candidate requested account erasure')}
                className="btn btn-secondary btn-mobile-full"
                style={{ fontSize: 12, color: '#ef4444', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} />
                <span>{submitting === 'deletion' ? 'Submitting...' : 'Request Deletion'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Past Privacy Requests */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>
          Privacy Request History
        </h2>
        {loading ? (
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Loading request history...</p>
        ) : requests.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>No privacy requests submitted yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#fafaf9',
                  border: '1px solid var(--border)',
                  fontSize: 12.5,
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <strong style={{ textTransform: 'capitalize' }}>{req.request_type}</strong>
                  {req.reason && <span style={{ color: '#64748b' }}> — {req.reason}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: req.status === 'completed' ? '#ecfdf5' : '#fffbeb', color: req.status === 'completed' ? '#065f46' : '#854d0e', textTransform: 'uppercase' }}>
                    {req.status}
                  </span>
                  <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
