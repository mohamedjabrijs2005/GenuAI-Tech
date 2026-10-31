'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  User, CheckCircle2, AlertCircle, Clock, Shield,
  FileCheck, BookOpen, Cpu, ArrowLeft, ExternalLink,
  GraduationCap, Briefcase, Mail, Phone, MapPin,
  Calendar, Check, X, Send, AlertTriangle, Sparkles, MessageSquare
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function RecruiterCandidateReviewPage() {
  const params = useParams() as { id: string; candidateId: string };
  const vacancyId = params?.id;
  const targetId = params?.candidateId;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [reviewingEvidenceId, setReviewingEvidenceId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/company/vacancies/${vacancyId}/candidates/${targetId}`);
      setData(res.data);
      setNotes(res.data?.recruiterNotes || '');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load candidate profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vacancyId && targetId) loadData();
  }, [vacancyId, targetId]);

  const handleDecision = async (decision: string) => {
    if (decision === 'REJECTED' && !notes.trim()) {
      const proceed = window.confirm('Are you sure you want to reject without adding notes?');
      if (!proceed) return;
    }

    setDeciding(true);
    try {
      await api.post(`/company/vacancies/${vacancyId}/candidates/${targetId}/decision`, {
        decision,
        notes,
      });
      toast.success(`Candidate marked as ${decision.replace(/_/g, ' ')}`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to record decision');
    } finally {
      setDeciding(false);
    }
  };

  const handleEvidenceReview = async (evidenceId: string, reviewStatus: 'APPROVED' | 'REJECTED') => {
    setReviewingEvidenceId(evidenceId);
    try {
      await api.post(`/company/vacancies/${vacancyId}/candidates/${targetId}/evidence/${evidenceId}/review`, {
        reviewStatus,
        note: `Reviewed as ${reviewStatus} by recruiter`,
      });
      toast.success(`Evidence ${reviewStatus.toLowerCase()}`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to review evidence');
    } finally {
      setReviewingEvidenceId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: '32px' }}>
        <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px' }} />
        <h2>Access Denied or Profile Not Found</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>{error}</p>
        <Link href={`/dashboard/vacancies/${vacancyId}/readiness`} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          ← Back to Ready Candidates
        </Link>
      </div>
    );
  }

  const { candidate, target, vacancy, coverage, requirements, evidence, assessment, practice } = data;
  const educationList = Array.isArray(candidate.education) ? candidate.education : [];
  const currentDecision = target.recruiter_decision || target.target_status || 'PENDING_REVIEW';

  const decisionBadges: Record<string, { bg: string; color: string }> = {
    SHORTLISTED: { bg: '#f0fdf4', color: '#166534' },
    REQUEST_MORE_EVIDENCE: { bg: '#fff7ed', color: '#c2410c' },
    INTERVIEW_SCHEDULED: { bg: '#eff6ff', color: '#1e40af' },
    INTERVIEWED: { bg: '#f5f3ff', color: '#6b21a8' },
    OFFERED: { bg: '#fefce8', color: '#854d0e' },
    HIRED: { bg: '#dcfce7', color: '#15803d' },
    REJECTED: { bg: '#fef2f2', color: '#991b1b' },
    PENDING_REVIEW: { bg: '#f1f5f9', color: '#475569' },
  };
  const dBadge = decisionBadges[currentDecision] || decisionBadges.PENDING_REVIEW;

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back button */}
      <div>
        <Link
          href={`/dashboard/vacancies/${vacancyId}/readiness`}
          style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> Back to Ready Candidates
        </Link>
      </div>

      {/* Hero Header */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fef3c7', color: '#b45309' }}>
                RECRUITER REVIEW
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: dBadge.bg, color: dBadge.color }}>
                {currentDecision.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '2px 0 6px', color: 'var(--text-primary)' }}>
              {candidate.first_name} {candidate.last_name}
            </h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={13} /> {candidate.email}</span>
              {candidate.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={13} /> {candidate.phone}</span>}
              {candidate.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {candidate.location}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase size={13} /> Target: {vacancy.title}</span>
            </div>
          </div>

          {/* Coverage Summary Box */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 20px', textAlign: 'center', minWidth: 160 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Requirement Coverage</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: coverage?.coverage_pct >= 60 ? '#16a34a' : '#d97706' }}>
              {Math.round(coverage?.coverage_pct || 0)}%
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {coverage?.supported_count || 0} Supported · {coverage?.gap_count || 0} Gaps
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Academic Record & Readiness Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {/* Academic Record */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <GraduationCap size={18} color="#2563eb" />
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Academic Record
            </h2>
          </div>
          {educationList.length === 0 ? (
            <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>No academic records on file.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {educationList.map((edu: any, i: number) => (
                <div key={i} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
                    {edu.degree || edu.qualification || 'Degree'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {edu.institution || edu.school || 'University'} {edu.year ? `· ${edu.year}` : ''}
                  </div>
                  {edu.cgpa && (
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#16a34a', marginTop: 2 }}>
                      CGPA / Grade: {edu.cgpa}
                    </div>
                  )}
                  {edu.relevant_subjects && (
                    <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                      Subjects: {Array.isArray(edu.relevant_subjects) ? edu.relevant_subjects.join(', ') : edu.relevant_subjects}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assessment & Practice Summary */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FileCheck size={18} color="#7c3aed" />
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Assessment & Practice Results
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Official Assessment</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                Status: {assessment?.status || 'Not Submitted'} {assessment?.score != null ? `· Score: ${assessment.score}%` : ''}
              </div>
              {assessment?.submitted_at && (
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Submitted: {new Date(assessment.submitted_at).toLocaleDateString()}
                </div>
              )}
            </div>

            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Practice Summary</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginTop: 2 }}>
                {practice?.completed_sets || 0} Sets Completed · {practice?.total_attempts || 0} Total Attempts
                {practice?.best_score != null ? ` · Best: ${practice.best_score}%` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Breakdown by Requirement */}
      <div className="card" style={{ padding: '22px 26px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Requirement Coverage Breakdown ({requirements.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {requirements.map((req: any, i: number) => {
            const isSupported = req.status === 'SUPPORTED';
            const isPending = req.status === 'PENDING';
            return (
              <div
                key={req.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: 8,
                  border: `1px solid ${isSupported ? '#bbf7d0' : isPending ? '#fde68a' : '#e2e8f0'}`,
                  background: isSupported ? '#f0fdf4' : isPending ? '#fffbeb' : '#fff',
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginRight: 8 }}>#{i + 1}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{req.name}</span>
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>({req.importance || 'REQUIRED'})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: isSupported ? '#dcfce7' : isPending ? '#fef3c7' : '#f1f5f9',
                    color: isSupported ? '#166534' : isPending ? '#b45309' : '#475569',
                  }}>
                    {req.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence List */}
      <div className="card" style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Submitted Evidence ({evidence.length})
          </h2>
        </div>
        {evidence.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>No evidence submitted by candidate yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {evidence.map((ev: any) => {
              const isApproved = ['APPROVED', 'ACCEPTED'].includes((ev.review_status || '').toUpperCase());
              const isRejected = (ev.review_status || '').toUpperCase() === 'REJECTED';
              return (
                <div
                  key={ev.id}
                  style={{
                    padding: '16px 20px', borderRadius: 10,
                    border: '1px solid #e2e8f0', background: isApproved ? '#f0fdf4' : isRejected ? '#fef2f2' : '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#e2e8f0', color: '#475569' }}>
                          {(ev.evidence_type || 'EVIDENCE').replace(/_/g, ' ')}
                        </span>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                          background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                          color: isApproved ? '#166534' : isRejected ? '#991b1b' : '#b45309',
                        }}>
                          {ev.review_status || 'PENDING REVIEW'}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{ev.title}</div>
                      {ev.description && (
                        <div style={{ fontSize: 12.5, color: '#475569', margin: '4px 0 6px', lineHeight: 1.4 }}>
                          {ev.description}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        Submitted {ev.submitted_at ? new Date(ev.submitted_at).toLocaleDateString() : '—'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {(ev.file_url || ev.external_url) && (
                        <a
                          href={ev.file_url || ev.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-xs"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <ExternalLink size={12} /> View
                        </a>
                      )}
                      <button
                        onClick={() => handleEvidenceReview(ev.id, 'APPROVED')}
                        disabled={reviewingEvidenceId === ev.id}
                        className="btn btn-gold btn-xs"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Check size={12} /> Approve
                      </button>
                      <button
                        onClick={() => handleEvidenceReview(ev.id, 'REJECTED')}
                        disabled={reviewingEvidenceId === ev.id}
                        className="btn btn-secondary btn-xs"
                        style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <X size={12} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recruiter Notes & Decision Section */}
      <div className="card" style={{ padding: '24px 28px', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <MessageSquare size={18} color="#b8860b" />
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Recruiter Notes & Human Decision
          </h2>
        </div>
        <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>
          Private recruiter notes are logged into audit history and never exposed to the candidate.
        </p>

        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add private evaluation notes, interview takeaways, or reason for decision..."
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', marginBottom: 18,
          }}
        />

        {/* Action Decision Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => handleDecision('SHORTLISTED')}
            disabled={deciding}
            className="btn btn-gold"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <CheckCircle2 size={14} /> Shortlist
          </button>

          <button
            onClick={() => handleDecision('REQUEST_MORE_EVIDENCE')}
            disabled={deciding}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            Request More Evidence
          </button>

          <button
            onClick={() => handleDecision('INTERVIEW_SCHEDULED')}
            disabled={deciding}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            Schedule Interview
          </button>

          <button
            onClick={() => handleDecision('INTERVIEWED')}
            disabled={deciding}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            Mark Interviewed
          </button>

          <button
            onClick={() => handleDecision('OFFERED')}
            disabled={deciding}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            Offer
          </button>

          <button
            onClick={() => handleDecision('HIRED')}
            disabled={deciding}
            className="btn btn-gold"
            style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            Hire
          </button>

          <button
            onClick={() => handleDecision('REJECTED')}
            disabled={deciding}
            className="btn btn-secondary"
            style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <X size={14} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

