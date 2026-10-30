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
  Sparkles,
  Heart,
  X,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function VacancyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vacancyId = params?.id as string;

  const [vacancy, setVacancy] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [existingTarget, setExistingTarget] = useState<any>(null);
  const [interest, setInterest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [targeting, setTargeting] = useState(false);
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.get(`/candidate-portal/vacancies/${vacancyId}`),
      api.get('/candidate-portal/targets').catch(() => ({ data: { targets: [] } })),
      api.get('/candidate/interests').catch(() => ({ data: { interests: [] } })),
    ])
      .then(([vacRes, targetRes, interestRes]) => {
        if (!isMounted) return;
        setVacancy(vacRes.data?.vacancy);
        setRequirements(vacRes.data?.requirements || []);

        const matching = (targetRes.data?.targets || []).find((t: any) => t.vacancy_id === vacancyId);
        if (matching) {
          setExistingTarget(matching);
        }

        const matchInterest = (interestRes.data?.interests || []).find((i: any) => i.vacancy_id === vacancyId && i.interest_status === 'EXPRESSED');
        if (matchInterest) {
          setInterest(matchInterest);
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

  const handleExpressInterest = async () => {
    setSubmittingInterest(true);
    try {
      const res = await api.post(`/candidate/vacancies/${vacancyId}/interest`);
      setInterest(res.data?.interest || { interest_status: 'EXPRESSED' });
      toast.success('Your interest in this role has been shared with the hiring team!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to express interest in role');
    } finally {
      setSubmittingInterest(false);
    }
  };

  const handleWithdrawInterest = async () => {
    setSubmittingInterest(true);
    try {
      await api.delete(`/candidate/vacancies/${vacancyId}/interest`);
      setInterest(null);
      toast.success('Interest withdrawn successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to withdraw interest');
    } finally {
      setSubmittingInterest(false);
    }
  };

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
          background: '#ffffff',
          borderRadius: 12,
          padding: '28px 32px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: 'rgba(5, 150, 105, 0.1)',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#059669',
                  textTransform: 'uppercase',
                }}
              >
                {vacancy.company_name} · Verified Employer
              </span>
              {vacancy.version_number && (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Version {vacancy.version_number}</span>
              )}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 10px', color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>{vacancy.title}</h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
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
            ) : interest ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCreateTarget}
                  disabled={targeting}
                  className="btn btn-gold"
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
                  <span>{targeting ? 'Creating Target...' : 'Create Target for this Role'}</span>
                </button>
                <button
                  onClick={handleWithdrawInterest}
                  disabled={submittingInterest}
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 16px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <X size={14} />
                  <span>Withdraw Interest</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleExpressInterest}
                disabled={submittingInterest}
                className="btn btn-gold"
                style={{
                  padding: '10px 24px',
                  fontSize: 13.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Sparkles size={16} />
                <span>{submittingInterest ? 'Recording Interest...' : 'Express Interest in Role'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding-Style Step Progression Banner */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
              Recruitment Transparency Workflow
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
              From Interest to Human Decision
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {interest ? (
              <span style={{
                padding: '4px 12px', borderRadius: 99,
                background: '#ecfdf5', border: '1px solid #a7f3d0',
                fontSize: 11.5, fontWeight: 700, color: '#065f46',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <CheckCircle2 size={13} style={{ color: '#059669' }} />
                Interest Confirmed
              </span>
            ) : (
              <span style={{
                padding: '4px 12px', borderRadius: 99,
                background: '#fef3c7', border: '1px solid #fde68a',
                fontSize: 11.5, fontWeight: 700, color: '#92400e',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Sparkles size={13} style={{ color: '#b45309' }} />
                Step 1: Express Interest
              </span>
            )}
            {existingTarget && (
              <span style={{
                padding: '4px 12px', borderRadius: 99,
                background: '#eff6ff', border: '1px solid #bfdbfe',
                fontSize: 11.5, fontWeight: 700, color: '#1e40af',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Target size={13} style={{ color: '#2563eb' }} />
                Target Active
              </span>
            )}
          </div>
        </div>

        {/* 4 Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            {
              step: '1', title: 'Express Interest',
              desc: interest ? 'Recorded with company' : 'Signals your intent to hiring team',
              done: Boolean(interest),
              active: !interest,
            },
            {
              step: '2', title: 'Create Target',
              desc: existingTarget ? 'Target workspace active' : 'Launches private preparation room',
              done: Boolean(existingTarget),
              active: Boolean(interest && !existingTarget),
            },
            {
              step: '3', title: 'Learn & Practice',
              desc: 'Structured requirements & assessments',
              done: false,
              active: Boolean(existingTarget),
            },
            {
              step: '4', title: 'Review & Decision',
              desc: 'Direct human evaluation by company',
              done: false,
              active: false,
            },
          ].map((s) => (
            <div
              key={s.step}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: s.done ? '1px solid #a7f3d0' : s.active ? '1px solid #fde68a' : '1px solid #f1f5f9',
                background: s.done ? '#f0fdf4' : s.active ? '#fffdf7' : '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: s.done ? '#059669' : s.active ? '#b8860b' : '#94a3b8',
                    color: '#ffffff', fontSize: 11, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {s.done ? '✓' : s.step}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.done ? '#065f46' : s.active ? '#854d0e' : '#475569' }}>
                  {s.title}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', paddingLeft: 30 }}>
                {s.desc}
              </div>
            </div>
          ))}
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
