'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  Save,
  Send,
  Sparkles,
  HelpCircle,
  Layers,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function TargetAssessmentPage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [requirementScores, setRequirementScores] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, { mcq?: string; text?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAssessment = async () => {
    try {
      const res = await api.get(`/candidate-portal/targets/${targetId}/assessment`);
      setTarget(res.data?.target);
      setAssessmentData(res.data);
      setAttempt(res.data?.attempt);
      setQuestions(res.data?.questions || []);
      setRequirementScores(res.data?.requirementScores || []);

      if (res.data?.attempt?.answers) {
        setAnswers(res.data.attempt.answers);
      }
    } catch (err) {
      console.error('Failed to load assessment data:', err);
      toast.error('Unable to load assessment workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [targetId]);

  // Live countdown timer for active attempt
  useEffect(() => {
    if (attempt?.status === 'IN_PROGRESS' && attempt?.expires_at) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((new Date(attempt.expires_at).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          toast.error('Assessment session time has expired. Submitting current responses.');
          handleSubmit(true);
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setTimeLeft(null);
    }
  }, [attempt?.status, attempt?.expires_at]);

  const handleStart = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/candidate-portal/targets/${targetId}/assessment/start`);
      setAttempt(res.data?.attempt);
      if (res.data?.resumed) {
        toast.success('Resumed active assessment session.');
      } else {
        toast.success('Official assessment session initiated (45 minutes).');
      }
      await fetchAssessment();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start assessment session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!attempt?.id) return;
    try {
      setSavingDraft(true);
      await api.post(`/candidate-portal/targets/${targetId}/assessment/save-draft`, {
        attemptId: attempt.id,
        answers,
      });
      setLastSaved(new Date().toLocaleTimeString());
      toast.success('Draft responses saved.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!attempt?.id) return;
    if (!autoSubmit && !window.confirm('Are you ready to submit your official assessment? Responses will be locked for review.')) {
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/candidate-portal/targets/${targetId}/assessment/submit`, {
        attemptId: attempt.id,
        answers,
      });
      toast.success(res.data?.message || 'Assessment submitted successfully!');
      await fetchAssessment();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMcqSelect = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        mcq: optionKey,
      },
    }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        text,
      },
    }));
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
  const isCompleted = attempt?.status === 'SUBMITTED' || attempt?.status === 'GRADED';
  const isInProgress = attempt?.status === 'IN_PROGRESS';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 940, margin: '0 auto', paddingBottom: 60 }}>
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
          background: 'var(--card-bg)',
          borderRadius: 14,
          padding: '24px 28px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: 99,
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--primary)',
                textTransform: 'uppercase',
              }}
            >
              {target?.company_name} · Official Evaluation
            </span>
            {isInProgress && (
              <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: 11, fontWeight: 700 }}>
                In Progress
              </span>
            )}
            {isCompleted && (
              <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: 11, fontWeight: 700 }}>
                Completed & Evaluated
              </span>
            )}
          </div>

          {/* Authoritative Live Timer */}
          {isInProgress && timeLeft !== null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 8,
              background: timeLeft < 300 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.15)',
              border: `1px solid ${timeLeft < 300 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(212, 175, 55, 0.3)'}`,
            }}>
              <Clock size={16} color={timeLeft < 300 ? '#ef4444' : 'var(--primary)'} />
              <span style={{
                fontFamily: 'monospace',
                fontSize: 15,
                fontWeight: 800,
                color: timeLeft < 300 ? '#ef4444' : 'var(--primary)',
              }}>
                {formatTimer(timeLeft)}
              </span>
            </div>
          )}
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px', color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
          Official Assessment Workspace
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>
          Role-configured technical evaluation for <strong style={{ color: 'var(--text-primary)' }}>{target?.vacancy_title}</strong>.
        </p>
      </div>

      {/* Transparent Integrity Notice */}
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(34, 197, 94, 0.05)',
          borderRadius: 10,
          border: '1px solid rgba(34, 197, 94, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <ShieldCheck size={20} style={{ flexShrink: 0, color: '#22c55e', marginTop: 2 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Governance & Human Oversight Policy:</strong> Assessments are evaluated with complete human transparency.
          Assessment score ≠ hiring decision, and low results do not trigger automatic rejection. All results map directly to your requirement coverage ledger.
        </div>
      </div>

      {/* COMPLETED STATE */}
      {isCompleted && (
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CheckCircle2 size={26} color="#22c55e" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                  Assessment Completed
                </h2>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Submitted on {new Date(attempt.submitted_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{
              textAlign: 'right',
              padding: '10px 20px',
              borderRadius: 12,
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>OVERALL SCORE</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--primary)' }}>
                {Math.round(Number(attempt.score || 0))}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
            Requirement-Level Capability Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {requirementScores.map((scoreItem) => (
              <div
                key={scoreItem.requirement_id}
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {scoreItem.requirement_name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    {scoreItem.assessment_notes || 'Verified requirement capability'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: Number(scoreItem.score) >= (Number(scoreItem.max_score) * 0.7) ? '#22c55e' : '#f59e0b',
                  }}>
                    {Math.round(Number(scoreItem.score))}/{scoreItem.max_score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Link
              href={`/candidate/targets/${targetId}/evidence`}
              className="btn btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <FileText size={16} />
              <span>View Target Coverage in Evidence Locker</span>
            </Link>
          </div>
        </div>
      )}

      {/* IN PROGRESS STATE */}
      {isInProgress && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {questions.map((q, idx) => {
            const currentAnswer = answers[q.id] || {};
            return (
              <div key={q.id} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                    QUESTION {idx + 1} OF {questions.length} · {q.importance}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                    {q.maxScore} pts
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {q.title}
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                  {q.prompt}
                </p>

                {/* MCQ Question */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                    {q.mcqQuestion}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options?.map((opt: any) => {
                      const isSelected = currentAnswer.mcq === opt.key;
                      return (
                        <label
                          key={opt.key}
                          onClick={() => handleMcqSelect(q.id, opt.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'var(--bg-secondary)',
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="radio"
                            name={`mcq_${q.id}`}
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Scenario Explanation */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Technical Rationale & Production Considerations:
                  </label>
                  <textarea
                    rows={3}
                    className="input"
                    style={{ width: '100%', resize: 'vertical' }}
                    placeholder="Provide architecture details, trade-offs, and failure recovery mechanics..."
                    value={currentAnswer.text || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                  />
                </div>
              </div>
            );
          })}

          {/* Action Bar */}
          <div style={{
            position: 'sticky',
            bottom: 20,
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px 24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              {lastSaved && <span>Last saved: {lastSaved}</span>}
              <button
                type="button"
                className="btn btn-secondary"
                disabled={savingDraft}
                onClick={handleSaveDraft}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 12 }}
              >
                <Save size={14} />
                <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontWeight: 800 }}
            >
              <Send size={15} />
              <span>{submitting ? 'Submitting...' : 'Submit Final Assessment'}</span>
            </button>
          </div>
        </div>
      )}

      {/* NOT STARTED STATE */}
      {!isInProgress && !isCompleted && isConfigured && (
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Assessment Session Ready
            </h2>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
              Active
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>DURATION</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>45 Minutes</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>REQUIREMENTS MAPPED</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{questions.length} Competencies</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SCORING WEIGHT</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>100 Points Total</div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Rules & Expectations</h3>
            <ul style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
              <li>Ensure a stable internet connection before starting.</li>
              <li>You can save draft answers continuously during the session.</li>
              <li>Your results directly update the requirement coverage ledger in your Evidence Locker.</li>
              <li>Recruiters evaluate submissions alongside code repositories and portfolio evidence.</li>
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
              style={{ padding: '12px 28px', fontSize: 14, fontWeight: 800 }}
              onClick={handleStart}
            >
              Start Official Assessment
            </button>
          </div>
        </div>
      )}

      {/* UNCONFIGURED STATE */}
      {!isConfigured && (
        <div className="card" style={{ padding: '36px 24px', textAlign: 'center' }}>
          <BadgeCheck size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            No Assessment Configured For This Vacancy
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 20px' }}>
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
