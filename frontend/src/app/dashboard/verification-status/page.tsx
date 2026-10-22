'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, ShieldAlert, Clock, CheckCircle2, AlertCircle,
  Building2, Briefcase, ArrowRight, FileText, ChevronRight, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function VerificationStatusPage() {
  const { company, user, refreshAuth } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/company/profile').catch(() => null);
      if (res?.data?.company) {
        setProfile(res.data.company);
      } else {
        const local = localStorage.getItem('genuai_company_profile');
        if (local) setProfile(JSON.parse(local));
      }
    } catch {
      const local = localStorage.getItem('genuai_company_profile');
      if (local) setProfile(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const rawStatus = (company?.verificationStatus || profile?.verificationStatus || 'PENDING_VERIFICATION').toUpperCase();
  const isApproved = rawStatus === 'APPROVED' || rawStatus === 'VERIFIED';
  const isChangesRequested = rawStatus === 'CHANGES_REQUESTED';
  const isPending = !isApproved && !isChangesRequested;

  return (
    <div className="page-content" style={{ background: 'var(--surface)', minHeight: '100vh', padding: '28px 32px 56px' }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 24,
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Platform Governance
            </span>
            <span style={{ color: 'var(--border)' }}>&middot;</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Organization Verification</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>
            Verification Status
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => { refreshAuth(); fetchProfile(); }}
            disabled={loading}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: '#ffffff',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Status</span>
          </button>
          <Link
            href="/dashboard"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#0f172a',
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Workspace Dashboard</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid var(--border)',
        padding: '32px 30px',
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 24 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: isApproved ? '#dcfce7' : isChangesRequested ? '#fef2f2' : '#fef3c7',
            color: isApproved ? '#059669' : isChangesRequested ? '#b91c1c' : '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {isApproved ? <ShieldCheck size={28} /> : isChangesRequested ? <AlertCircle size={28} /> : <Clock size={28} />}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isApproved && 'Organization Verified & Approved'}
                {isChangesRequested && 'Information Update Required'}
                {isPending && 'Platform Verification Under Review'}
              </h2>
              <span style={{
                padding: '3px 10px',
                borderRadius: 99,
                fontSize: 11.5,
                fontWeight: 800,
                background: isApproved ? '#dcfce7' : isChangesRequested ? '#fee2e2' : '#fef3c7',
                color: isApproved ? '#059669' : isChangesRequested ? '#991b1b' : '#92400e',
              }}>
                {rawStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, maxWidth: 740 }}>
              {isApproved && 'Your company identity and authorized representation have been reviewed and approved by Platform Administration. You hold full permissions to publish vacancies and evaluate applicants.'}
              {isChangesRequested && 'Platform compliance requested additional details regarding your business registration or domain before publication permissions can be activated.'}
              {isPending && 'Your corporate onboarding details have been submitted to GenuAI Platform Governance. An administrator reviews corporate registrations within 1 business day. Approval is granted upon official domain and entity validation, not merely business email registration.'}
            </p>
          </div>
        </div>

        {/* Audit Pipeline Steps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          padding: '20px 24px',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>1. Onboarding Submitted</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Workspace &amp; representative profile saved</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {isApproved ? (
              <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
            ) : (
              <Clock size={18} style={{ color: '#b45309', flexShrink: 0, marginTop: 2 }} />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>2. Admin Audit</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {isApproved ? 'Identity verified & approved' : 'Currently in review queue'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {isApproved ? (
              <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
            ) : (
              <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #cbd5e1', display: 'inline-block', flexShrink: 0, marginTop: 2 }} />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>3. Public Publishing</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {isApproved ? 'Active on public marketplace' : 'Draft-only until verification'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Operational Context Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Card 1: What is Allowed Right Now */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={17} style={{ color: '#b8860b' }} />
            Workspace Capabilities
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
              <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <span>Create departments and configure organizational roles</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
              <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <span>Define specific requirement rubrics and proof requirements</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
              <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <span>Prepare draft vacancies ready for moderation upon approval</span>
            </div>
          </div>

          <Link
            href="/dashboard/vacancies"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span>Prepare Draft Vacancies</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Card 2: Company Profile Summary */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={17} style={{ color: '#b8860b' }} />
            Submitted Dossier
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#475569', marginBottom: 20 }}>
            <div><strong>Company:</strong> {company?.name || profile?.name || 'Workspace'}</div>
            <div><strong>Location:</strong> {profile?.location || 'Registered Office'}</div>
            <div><strong>Industry:</strong> {profile?.industry || 'Enterprise'}</div>
            <div><strong>Contact:</strong> {profile?.hiringContactName || user?.firstName || 'Representative'}</div>
            <div><strong>Work Email:</strong> {profile?.officialEmail || user?.email}</div>
          </div>

          <Link
            href="/dashboard/company-profile"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span>View Full Company Profile</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
