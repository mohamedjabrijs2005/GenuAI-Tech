'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CandidatePrivacyPage() {
  const { user } = useAuth();
  const [downloadRequested, setDownloadRequested] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
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
              background: 'rgba(5, 150, 105, 0.2)',
              fontSize: 11,
              fontWeight: 700,
              color: '#86efac',
              textTransform: 'uppercase',
            }}
          >
            Privacy & Tenant Isolation Architecture
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
          Privacy, Data Separation & Control Center
        </h1>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 650 }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ padding: '16px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--primary)' }}>
              <Building2 size={18} />
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Target for Company A</h3>
            </div>
            <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, margin: 0 }}>
              Company A can review only evidence submitted for Company A's vacancy. They cannot see your application status with Company B.
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

            {downloadRequested ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={14} /> Request Queued
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setDownloadRequested(true)}
                className="btn btn-secondary"
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} />
                <span>Request Data Export</span>
              </button>
            )}
          </div>

          {/* Account Deletion */}
          <div
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

            {deleteRequested ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
                Deactivation Request Pending
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteRequested(true)}
                className="btn btn-secondary"
                style={{ fontSize: 12, color: '#ef4444', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} />
                <span>Request Deletion</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
