'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  RefreshCw,
  Info,
  Shield,
  Clock,
  Award,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Check,
  X,
  Target,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface PracticeQuestion {
  id: string;
  requirement_name: string;
  title: string;
  prompt: string;
  question_type: string;
  options: { key: string; text: string }[];
  topic_area: string;
  difficulty: string;
}

interface QuestionResult {
  questionId: string;
  title: string;
  prompt: string;
  options: { key: string; text: string }[];
  chosenKey: string;
  correctKey: string;
  isCorrect: boolean;
  explanation: string;
  topicArea: string;
}

interface RequirementSet {
  requirementId: string;
  requirementName: string;
  importance: string;
  availableQuestions: number;
  attemptsCount: number;
  isCompleted: boolean;
  bestScore: number;
  lastAttempt: any;
}

export default function TargetPracticePage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [requirementSets, setRequirementSets] = useState<RequirementSet[]>([]);
  const [attemptsHistory, setAttemptsHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active session state
  const [activeSet, setActiveSet] = useState<string | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Completed results view
  const [submissionResults, setSubmissionResults] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    topicsToRevisit: string[];
    results: QuestionResult[];
  } | null>(null);

  const fetchPracticeData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/candidate-portal/targets/${targetId}/practice`);
      setTarget(res.data?.target);
      setRequirementSets(res.data?.requirementSets || []);
      setAttemptsHistory(res.data?.attemptsHistory || []);
      setSummary(res.data?.summary);
    } catch (err: any) {
      console.error('Failed to load practice sets:', err);
      toast.error(err.response?.data?.error || 'Unable to load practice sets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) fetchPracticeData();
  }, [targetId]);

  const handleStartPractice = async (reqName: string) => {
    try {
      setLoading(true);
      const res = await api.post(`/candidate-portal/targets/${targetId}/practice/start`, {
        requirementName: reqName,
      });

      setActiveSet(reqName);
      setActiveAttemptId(res.data?.attemptId);
      setPracticeQuestions(res.data?.questions || []);
      setSelectedAnswers({});
      setSubmissionResults(null);
      toast.success(`Practice session started for ${reqName}`);
    } catch (err: any) {
      console.error('Start practice error:', err);
      toast.error(err.response?.data?.error || 'Failed to start practice session');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!activeAttemptId) return;

    // Check if at least one question is answered
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount === 0) {
      toast.error('Please select an answer for at least one question before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/candidate-portal/targets/${targetId}/practice/submit`, {
        attemptId: activeAttemptId,
        answers: selectedAnswers,
      });

      setSubmissionResults({
        score: res.data?.score,
        maxScore: res.data?.maxScore,
        percentage: res.data?.percentage,
        topicsToRevisit: res.data?.topicsToRevisit || [],
        results: res.data?.results || [],
      });

      toast.success('Practice attempt submitted! Review explanations below.');
      await fetchPracticeData();
    } catch (err: any) {
      console.error('Submit practice error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit practice attempt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitActiveSession = () => {
    setActiveSet(null);
    setActiveAttemptId(null);
    setPracticeQuestions([]);
    setSelectedAnswers({});
    setSubmissionResults(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Practice Sandbox...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
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
          <span>Back to Target Workspace Overview</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '26px 30px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#b45309',
                  textTransform: 'uppercase',
                }}
              >
                {target?.company_name} · Private Sandbox
              </span>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#15803d',
                }}
              >
                Requirement-Linked Practice
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px', color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              Candidate Practice Sandbox
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, maxWidth: 680 }}>
              Self-test your knowledge on the exact competencies required for{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{target?.vacancy_title}</strong>. Attempt questions,
              review detailed explanations, and identify topics to revisit before official assessment.
            </p>
          </div>

          {/* Practice Summary Box */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              minWidth: 220,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
              Sets Completed
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', marginBottom: 4 }}>
              {summary?.completedSets || 0} / {summary?.totalRequirements || requirementSets.length}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              {summary?.totalAttempts || 0} Total Practice Attempts
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Governance Notice */}
      <div
        style={{
          padding: '16px 20px',
          background: '#f0fdf4',
          borderRadius: 10,
          border: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          fontSize: 12.5,
          color: '#166534',
          lineHeight: 1.5,
        }}
      >
        <Shield size={20} style={{ flexShrink: 0, color: '#16a34a', marginTop: 1 }} />
        <div>
          <strong>Private Preparation Policy:</strong> Practice is private to you. Scores and unsuccessful attempts
          are <em>never</em> shared with recruiters and do not modify your official assessment scores or requirement coverage.
          Use this sandbox freely to verify your readiness and learn from mistakes.
        </div>
      </div>

      {/* ACTIVE PRACTICE SESSION VIEW */}
      {activeSet && !submissionResults && (
        <div className="card" style={{ padding: '28px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 14,
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                Active Practice Session
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                {activeSet} Practice Set ({practiceQuestions.length} Questions)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleExitActiveSession}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              Exit Without Submitting
            </button>
          </div>

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 28 }}>
            {practiceQuestions.map((q, idx) => (
              <div
                key={q.id}
                style={{
                  padding: '20px',
                  borderRadius: 10,
                  background: '#fafaf9',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)' }}>Question #{idx + 1}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: '#f1f5f9',
                      color: '#64748b',
                    }}
                  >
                    {q.topic_area || q.difficulty || 'Mid'}
                  </span>
                </div>

                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>{q.title}</h4>
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>{q.prompt}</p>

                {/* Radio Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.options.map((opt) => {
                    const isSelected = selectedAnswers[q.id] === opt.key;
                    return (
                      <label
                        key={opt.key}
                        onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '12px 16px',
                          borderRadius: 8,
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt.key}
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ marginTop: 3 }}
                        />
                        <div style={{ fontSize: 13, color: isSelected ? '#1e3a8a' : '#334155', lineHeight: 1.4 }}>
                          <strong style={{ marginRight: 6 }}>{opt.key}.</strong>
                          {opt.text}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {Object.keys(selectedAnswers).length} of {practiceQuestions.length} questions answered
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleExitActiveSession}
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitAttempt}
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '9px 24px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {submitting ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14 }} />
                    <span>Grading Attempt...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Submit & View Explanations</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION RESULTS & EXPLANATIONS VIEW */}
      {submissionResults && (
        <div className="card" style={{ padding: '28px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                Practice Evaluation Results
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                {activeSet} Performance Breakdown
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: submissionResults.percentage >= 70 ? '#f0fdf4' : '#fef3c7',
                  border: submissionResults.percentage >= 70 ? '1px solid #bbf7d0' : '1px solid #fde68a',
                  color: submissionResults.percentage >= 70 ? '#15803d' : '#b45309',
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                Score: {submissionResults.score} / {submissionResults.maxScore} ({submissionResults.percentage}%)
              </div>

              <button
                type="button"
                onClick={() => handleStartPractice(activeSet!)}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RotateCcw size={13} />
                <span>Retry Set</span>
              </button>

              <button
                type="button"
                onClick={handleExitActiveSession}
                className="btn btn-primary"
                style={{ fontSize: 12, padding: '7px 14px' }}
              >
                Done
              </button>
            </div>
          </div>

          {/* Topics to Revisit Banner */}
          {submissionResults.topicsToRevisit.length > 0 && (
            <div
              style={{
                padding: '16px 20px',
                background: '#fffbeb',
                borderRadius: 10,
                border: '1px solid #fde68a',
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 6 }}>
                Recommended Topics to Revisit in Learn:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {submissionResults.topicsToRevisit.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fcd34d',
                    }}
                  >
                    • {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Question Review with Explanations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {submissionResults.results.map((res, idx) => (
              <div
                key={res.questionId}
                style={{
                  padding: '20px',
                  borderRadius: 10,
                  background: res.isCorrect ? '#f0fdf4' : '#fef2f2',
                  border: res.isCorrect ? '1px solid #bbf7d0' : '1px solid #fecaca',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {res.isCorrect ? (
                    <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                  ) : (
                    <X size={16} style={{ color: '#dc2626' }} />
                  )}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: res.isCorrect ? '#15803d' : '#b91c1c',
                      textTransform: 'uppercase',
                    }}
                  >
                    Question #{idx + 1} — {res.isCorrect ? 'Correct (+1 pt)' : 'Incorrect (0 pt)'}
                  </span>
                </div>

                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>{res.title}</h4>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 14px' }}>{res.prompt}</p>

                {/* Option breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {res.options.map((opt) => {
                    const isChosen = res.chosenKey === opt.key;
                    const isCorrect = res.correctKey === opt.key;

                    let bg = '#ffffff';
                    let border = '1px solid #e2e8f0';
                    let label = null;

                    if (isCorrect) {
                      bg = '#dcfce7';
                      border = '1px solid #86efac';
                      label = '✓ Correct Answer';
                    } else if (isChosen && !isCorrect) {
                      bg = '#fee2e2';
                      border = '1px solid #fca5a5';
                      label = '✗ Your Choice';
                    }

                    return (
                      <div
                        key={opt.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 6,
                          background: bg,
                          border: border,
                          fontSize: 12.5,
                          color: '#1e293b',
                        }}
                      >
                        <div>
                          <strong>{opt.key}.</strong> {opt.text}
                        </div>
                        {label && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: isCorrect ? '#166534' : '#991b1b',
                            }}
                          >
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 6,
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    fontSize: 12.5,
                    color: '#334155',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 2 }}>
                    Architecture Explanation:
                  </strong>
                  {res.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REQUIREMENT SETS LIST (When not in active quiz) */}
      {!activeSet && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
            Available Practice Sets by Requirement
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {requirementSets.map((set) => (
              <div
                key={set.requirementId}
                className="card"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#f1f5f9',
                        color: '#475569',
                      }}
                    >
                      {set.importance || 'REQUIRED'}
                    </span>
                    {set.isCompleted && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    {set.requirementName}
                  </h3>

                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    {set.availableQuestions > 0 ? (
                      <span>{set.availableQuestions} practice questions available</span>
                    ) : (
                      <span>Standard practice questions prepared</span>
                    )}
                  </div>

                  {set.attemptsCount > 0 && (
                    <div
                      style={{
                        fontSize: 11.5,
                        color: '#64748b',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span>Attempts: {set.attemptsCount}</span> ·{' '}
                      <span>Best Score: {set.bestScore} pts</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleStartPractice(set.requirementName)}
                  className={`btn ${set.isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                  style={{
                    width: '100%',
                    fontSize: 13,
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {set.isCompleted ? (
                    <>
                      <RotateCcw size={13} />
                      <span>Retake Practice Set</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCheck size={14} />
                      <span>Start Practice Set</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Past Practice History */}
          {attemptsHistory.length > 0 && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px', color: 'var(--text-primary)' }}>
                Target Practice Attempt History ({attemptsHistory.length} attempts)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {attemptsHistory.slice(0, 5).map((att) => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 8,
                      background: '#f8fafc',
                      border: '1px solid var(--border)',
                      fontSize: 12.5,
                    }}
                  >
                    <div>
                      <strong style={{ color: '#1e293b' }}>{att.requirement_name}</strong>
                      <span style={{ color: '#64748b', marginLeft: 8 }}>
                        Submitted {new Date(att.submitted_at || att.started_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 700, color: '#16a34a' }}>
                        Score: {att.score} / {att.max_score}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartPractice(att.requirement_name)}
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Link
          href={`/candidate/targets/${targetId}/learn`}
          className="btn btn-secondary"
          style={{ textDecoration: 'none', fontSize: 13 }}
        >
          ← Back to Learn Curriculum
        </Link>
        <Link
          href={`/candidate/targets/${targetId}/assessment`}
          className="btn btn-primary"
          style={{ textDecoration: 'none', fontSize: 13 }}
        >
          Proceed to Official Assessment →
        </Link>
      </div>
    </div>
  );
}
