'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Compass,
  Building2,
  MapPin,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  Target,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Calendar,
  AlertCircle,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import api from '@/lib/api';

export default function VacancyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vacancyId = params?.id as string;

  const [vacancy, setVacancy] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [existingTarget, setExistingTarget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [targeting, setTargeting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.get(`/candidate-portal/vacancies/${vacancyId}`),
      api.get('/candidate-portal/targets').catch(() => ({ data: { targets: [] } })),
    ])
      .then(([vacRes, targetRes]) => {
        if (!isMounted) return;
        setVacancy(vacRes.data?.vacancy);
        setRequirements(vacRes.data?.requirements || []);

        const matching = (targetRes.data?.targets || []).find((t: any) => t.vacancy_id === vacancyId);
        if (matching) {
          setExistingTarget(matching);
        }
      })
      .catch((err) => {
        console.error('Failed to load vacancy details:', err);
        setError('Vacancy not found or is no longer published.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vacancyId]);

  const handleCreateTarget = async () => {
    setTargeting(true);
    setError('');

    try {
      const res = await api.post('/candidate-portal/targets', { vacancyId });
      const newTargetId = res.data?.target?.id;
      if (newTargetId) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('genuai_active_target', newTargetId);
        }
        router.push(`/candidate/targets/${newTargetId}`);
      } else {
        router.push('/candidate/targets');
      }
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.targetId) {
        router.push(`/candidate/targets/${err.response.data.targetId}`);
      } else {
        setError(err.response?.data?.error || 'Failed to create target. Please try again.');
        setTargeting(false);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Vacancy Transparency Details...</div>
        </div>
      </div>
    );
  }

  if (error || !vacancy) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <AlertCircle size={36} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Vacancy Unavailable</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{error || 'This vacancy is not currently published.'}</p>
        <Link href="/candidate/vacancies" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          ← Back to Vacancies
        </Link>
      </div>
    );
  }

  const requiredReqs = requirements.filter((r) => (r.importance || 'REQUIRED').toUpperCase() === 'REQUIRED');
  const preferredReqs = requirements.filter((r) => (r.importance || '').toUpperCase() === 'PREFERRED');
  const optionalReqs = requirements.filter(
    (r) => (r.importance || '').toUpperCase() !== 'REQUIRED' && (r.importance || '').toUpperCase() !== 'PREFERRED'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Back Link */}
      <div>
        <Link
          href="/candidate/vacancies"
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
          <span>Back to Published Vacancies</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
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
                {vacancy.company_name} · Verified Employer
              </span>
              {vacancy.version_number && (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Version {vacancy.version_number}</span>
              )}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 10px' }}>{vacancy.title}</h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12.5, color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={14} />
                {vacancy.department_name || 'Engineering'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} />
                {vacancy.location || 'Remote'} ({vacancy.work_mode || 'Flexible'})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Briefcase size={14} />
                {vacancy.experience_level || 'Mid'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Layers size={14} />
                {requirements.length} Role Requirements
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {existingTarget ? (
              <Link
                href={`/candidate/targets/${existingTarget.target_id}`}
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Target size={16} />
                <span>Open Target Workspace</span>
              </Link>
            ) : (
              <button
                onClick={handleCreateTarget}
                disabled={targeting}
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: 13.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Target size={16} />
                <span>{targeting ? 'Creating Target...' : 'Target This Role'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Target Explanation Box */}
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(212, 175, 55, 0.08)',
          borderRadius: 10,
          border: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12.5,
          color: '#854d0e',
        }}
      >
        <FileCheck size={20} style={{ flexShrink: 0, color: '#d4af37' }} />
        <div>
          <strong>Target-Based Career Model:</strong> Creating a Target gives you a private workspace dedicated to this vacancy. You will review requirements, prepare, submit requirement-linked evidence, and track human recruiter review without automatic rejection algorithms.
        </div>
      </div>

      {/* Role Description */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>
          Role Description & Responsibilities
        </h2>
        <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {vacancy.job_description || 'Detailed engineering responsibilities and project scope.'}
        </div>
      </div>

      {/* Role Requirements & Accepted Evaluation Transparency */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            Transparent Role Requirements & Evaluation Methods
          </h2>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
            Hiring companies define accepted evaluation methods per requirement. You can support requirements through official assessments, repositories, work samples, or relevant experience.
          </p>
        </div>

        {/* 1. Required Competencies */}
        {requiredReqs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#991b1b',
                background: '#fee2e2',
                padding: '4px 10px',
                borderRadius: 6,
                display: 'inline-block',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Required Competencies ({requiredReqs.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {requiredReqs.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 8,
                    background: '#fafaf9',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{req.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', background: '#fee2e2', padding: '1px 6px', borderRadius: 4 }}>
                      Required
                    </span>
                  </div>
                  {req.description && (
                    <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 8 }}>{req.description}</div>
                  )}
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>
                    <span style={{ fontWeight: 600 }}>Accepted Proof: </span>
                    <span>Official Assessment, Work Sample, Code Repository, or Production Experience</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Preferred Competencies */}
        {preferredReqs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#854d0e',
                background: '#fef3c7',
                padding: '4px 10px',
                borderRadius: 6,
                display: 'inline-block',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Preferred Competencies ({preferredReqs.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {preferredReqs.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 8,
                    background: '#fafaf9',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{req.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#854d0e', background: '#fef3c7', padding: '1px 6px', borderRadius: 4 }}>
                      Preferred
                    </span>
                  </div>
                  {req.description && (
                    <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 8 }}>{req.description}</div>
                  )}
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>
                    <span style={{ fontWeight: 600 }}>Accepted Proof: </span>
                    <span>Project Demo, GitHub Repository, or Certificate</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Optional Competencies */}
        {optionalReqs.length > 0 && (
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#475569',
                background: '#f1f5f9',
                padding: '4px 10px',
                borderRadius: 6,
                display: 'inline-block',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Optional / Supplementary ({optionalReqs.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {optionalReqs.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 8,
                    background: '#fafaf9',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{req.name}</div>
                  {req.description && (
                    <div style={{ fontSize: 12.5, color: '#475569' }}>{req.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Target Commitment Call to Action */}
      <div
        className="card"
        style={{
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
            Ready to prepare and prove capability for this role?
          </div>
          <div style={{ fontSize: 12.5, color: '#64748b' }}>
            Targeting creates a private workspace with requirement roadmaps and evidence lockers.
          </div>
        </div>

        {existingTarget ? (
          <Link
            href={`/candidate/targets/${existingTarget.target_id}`}
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            Open Target Workspace →
          </Link>
        ) : (
          <button
            onClick={handleCreateTarget}
            disabled={targeting}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: 13, fontWeight: 800 }}
          >
            {targeting ? 'Creating Target...' : 'Create Target Workspace'}
          </button>
        )}
      </div>
    </div>
  );
}
