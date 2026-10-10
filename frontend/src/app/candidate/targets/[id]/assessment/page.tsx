'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BadgeCheck,
  Clock,
  ShieldCheck,
  AlertCircle,
  Accessibility,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
} from 'lucide-react';
import api from '@/lib/api';

export default function TargetAssessmentPage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get(`/candidate-portal/targets/${targetId}/assessment`)
      .then((res) => {
        if (!isMounted) return;
        setTarget(res.data?.target);
        setAssessmentData(res.data);
      })
      .catch((err) => {
        console.error('Failed to load assessment data:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Assessment Environment...</div>
        </div>
      </div>
    );
  }

  const isConfigured = assessmentData?.isConfigured;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 920, margin: '0 auto' }}>
      {/* Back Link */}
      <div>
        <Link
          href={`/candidate/targets/${targetId}`}
          style={{
            fontSize: 12.5,
            color: '#64748b',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Target Overview</span>
        </Link>
      </div>

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
              background: 'rgba(139, 92, 246, 0.2)',
              fontSize: 11,
              fontWeight: 700,
              color: '#c4b5fd',
              textTransform: 'uppercase',
            }}
          >
            {target?.company_name} · Official Evaluation
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
          Official Assessment Workspace
        </h1>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>
          Role-configured technical evaluation for <strong>{target?.vacancy_title}</strong>.
        </p>
      </div>

      {/* Transparent Integrity Notice */}
      <div
        style={{
          padding: '16px 20px',
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          fontSize: 12.5,
          color: '#475569',
          lineHeight: 1.5,
        }}
      >
        <ShieldCheck size={20} style={{ flexShrink: 0, color: '#059669', marginTop: 2 }} />
        <div>
          <strong>Integrity & Human Oversight Policy:</strong> Assessments are evaluated with complete human transparency.
          Any integrity signal requires human recruiter review—there is never automated disqualification or opaque AI judgement.
        </div>
      </div>

      {/* Assessment Status / Instructions */}
      {isConfigured ? (
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Assessment Session Ready
            </h2>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#ecfdf5', color: '#059669' }}>
              Active
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div style={{ padding: '12px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>DURATION</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>60 Minutes</div>
            </div>
            <div style={{ padding: '12px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>ATTEMPT POLICY</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>1 Official Session</div>
            </div>
            <div style={{ padding: '12px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>KEYBOARD CONTROLS</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>Fully Accessible</div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Rules & Expectations</h3>
            <ul style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
              <li>Ensure a stable internet connection before starting.</li>
              <li>You can save draft answers continuously during the session.</li>
              <li>Final submission will lock answers for recruiter evaluation.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Link
              href="/candidate/accessibility"
              style={{
                fontSize: 12.5,
                color: 'var(--primary)',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Accessibility size={15} />
              <span>Request Accommodation / Time Extension</span>
            </Link>

            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: 13.5, fontWeight: 800 }}
              onClick={() => alert('Assessment session will be launched in secure candidate environment.')}
            >
              Start Official Assessment
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '36px 24px', textAlign: 'center' }}>
          <BadgeCheck size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            No Assessment Configured For This Vacancy
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 480, margin: '0 auto 20px' }}>
            The hiring company has not designated an online assessment for this role. You can prove capability by submitting project repositories and work samples in the Evidence Locker.
          </p>
          <Link
            href={`/candidate/targets/${targetId}/evidence`}
            className="btn btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FileText size={15} />
            <span>Open Evidence Locker</span>
          </Link>
        </div>
      )}
    </div>
  );
}
