'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  BadgeCheck, ArrowLeft, Play, Send, Info, RotateCcw, CheckCircle2,
  AlertTriangle, Clock, XCircle, HelpCircle, Check, BookOpen, Dumbbell
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CheckItem {
  key: string;
  label: string;
  passed: boolean;
  help?: string;
  actionUrl?: string;
  actionText?: string;
}

export default function TargetOfficialAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const targetId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState<any>(null);

  // Countdown timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load target assessment workspace & eligibility
  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/candidate-portal/targets/${targetId}/assessment`);
      setData(res.data);

      const eligibility = res.data?.eligibility;
      const session = res.data?.activeSession || eligibility?.activeSession;

      if (session && session.status === 'IN_PROGRESS') {
        setActiveSession(session);
        setQuestions(res.data.questions || []);

        // Calculate timer
        const expiryMs = new Date(session.expires_at).getTime();
        const nowMs = Date.now();
        const diffSecs = Math.max(0, Math.floor((expiryMs - nowMs) / 1000));
        setSecondsRemaining(diffSecs);
      } else if (res.data?.latestSession && res.data?.latestSession?.result_summary) {
        setResultSummary(res.data.latestSession.result_summary);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load assessment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      loadWorkspace();
    }
  }, [targetId]);

  // Countdown timer effect
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0 || !activeSession) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession, secondsRemaining]);

  // Auto-submit when timer expires
  const handleAutoSubmit = async () => {
    if (!activeSession?.id || submitting) return;
    toast('Time has expired! Auto-submitting answers...', { icon: '⏰' });
    await submitSessionAnswers(true);
  };

  // Start official assessment
  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await api.post(`/candidate-portal/targets/${targetId}/assessment/session/start`, {
        timeLimitMinutes: 20,
      });

      const session = res.data?.session;
      const qList = res.data?.questions || [];

      setActiveSession(session);
      setQuestions(qList);
      setAnswers({});
      setResultSummary(null);

      const expiryMs = new Date(session.expires_at).getTime();
      const diffSecs = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
      setSecondsRemaining(diffSecs);

      toast.success(res.data?.resumed ? 'Resumed active assessment session' : 'Official assessment started! Good luck.');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.reasons?.join('; ') || 'Failed to start assessment';
      toast.error(msg);
    } finally {
      setStarting(false);
    }
  };

  // Submit assessment answers
  const submitSessionAnswers = async (autoExpire = false) => {
    if (!activeSession?.id) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/candidate-portal/targets/${targetId}/assessment/session/submit`, {
        sessionId: activeSession.id,
        answers,
      });

      toast.success(`Assessment submitted! Score: ${res.data.score}% (${res.data.passFail})`);
      setResultSummary(res.data.resultSummary || res.data);
      setActiveSession(null);
      setSecondsRemaining(null);

      // Refresh workspace data
      await loadWorkspace();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit assessment answers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const totalCount = questions.length;
    const confirmMsg = answeredCount < totalCount
      ? `You have answered ${answeredCount} of ${totalCount} questions. Submit now?`
      : 'Submit your Official Assessment now? Answers cannot be modified after submission.';

    if (window.confirm(confirmMsg)) {
      submitSessionAnswers(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const eligibility = data?.eligibility || {};
  const checks = eligibility?.checks || {};
  const reasons = eligibility?.reasons || [];
  const isEligible = eligibility?.eligible === true;
  const remainingAttempts = eligibility?.remainingAttempts ?? 2;
  const maxAttempts = eligibility?.maxAttempts ?? 2;
  const timeLimit = eligibility?.timeLimitMinutes ?? 20;
  const target = data?.target || {};
  const sessions = data?.sessions || [];

  const checkList: CheckItem[] = [
    {
      key: 'ownsTarget',
      label: 'Target Workspace Ownership',
      passed: checks.ownsTarget !== false,
      help: 'Candidate owns this active target',
    },
    {
      key: 'vacancyPublished',
      label: 'Role Vacancy Published',
      passed: checks.vacancyPublished === true,
      help: target.vacancyStatus ? `Current Status: ${target.vacancyStatus}` : 'Role must be live',
    },
    {
      key: 'targetStatusAllowed',
      label: 'Target Status Allows Assessment',
      passed: checks.targetStatusAllowed !== false,
      help: `Current Target Status: ${target.status || 'ACTIVE'}`,
    },
    {
      key: 'learnCompleted',
      label: 'Required Learn Modules Completed',
      passed: checks.learnCompleted === true,
      help: 'Study the role learning materials before taking the test',
      actionUrl: `/candidate/targets/${targetId}/learn`,
      actionText: 'Open Learn',
    },
    {
      key: 'practiceSubmitted',
      label: 'Required Practice Tasks Submitted',
      passed: checks.practiceSubmitted === true,
      help: 'Complete at least one practice attempt',
      actionUrl: `/candidate/targets/${targetId}/practice`,
      actionText: 'Open Practice',
    },
    {
      key: 'questionsExist',
      label: 'Official Assessment Questions Configured',
      passed: checks.questionsExist !== false,
      help: 'Evaluation questions configured for this vacancy',
    },
    {
      key: 'attemptsAvailable',
      label: `Attempts Available (${remainingAttempts} of ${maxAttempts} remaining)`,
      passed: remainingAttempts > 0,
      help: `${maxAttempts} attempts allowed per requirement/role`,
    },
  ];

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 940, margin: '0 auto', paddingBottom: 60 }}>
      {/* Navigation breadcrumb */}
      <Link
        href={`/candidate/targets/${targetId}`}
        style={{
          fontSize: 13,
          color: '#64748b',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={15} /> Back to Target Dashboard
      </Link>

      {/* Main Header Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '24px 30px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 99,
                  background: '#f5f3ff',
                  border: '1px solid #ede9fe',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#7c3aed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <BadgeCheck size={14} /> Official Assessment
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 99,
                  background: activeSession ? '#fef3c7' : '#f1f5f9',
                  color: activeSession ? '#b45309' : '#475569',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {activeSession ? 'IN PROGRESS' : (resultSummary ? 'COMPLETED' : 'READY')}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 6px', color: '#0f172a' }}>
              {target.title || 'Official Role Readiness Assessment'}
            </h1>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
              {target.company ? `Company: ${target.company} · ` : ''}
              Time Limit: {timeLimit} minutes · Max Attempts: {maxAttempts}
            </p>
          </div>

          {/* Active Countdown Timer Display */}
          {activeSession && secondsRemaining !== null && (
            <div
              style={{
                background: secondsRemaining < 180 ? '#fef2f2' : '#f8fafc',
                border: `2px solid ${secondsRemaining < 180 ? '#ef4444' : '#7c3aed'}`,
                borderRadius: 12,
                padding: '12px 20px',
                textAlign: 'center',
                minWidth: 140,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: secondsRemaining < 180 ? '#dc2626' : '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Clock size={13} /> Time Remaining
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: secondsRemaining < 180 ? '#dc2626' : '#0f172a' }}>
                {formatTimer(secondsRemaining)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info notice */}
      <div
        style={{
          padding: '14px 18px',
          background: '#eff6ff',
          borderRadius: 10,
          border: '1px solid #bfdbfe',
          display: 'flex',
          gap: 10,
          fontSize: 13,
          color: '#1e40af',
          lineHeight: 1.5,
        }}
      >
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Readiness Policy:</strong> Official Assessment results serve as an objective competency signal for human recruiters. No candidate is ever auto-rejected or auto-shortlisted by AI or automated scripts.
        </div>
      </div>

      {/* 1. ELIGIBILITY SCREEN (When no session is active) */}
      {!activeSession && (
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: '28px 32px',
            border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                Assessment Eligibility Verification
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                All criteria must be satisfied before starting an Official Assessment session.
              </p>
            </div>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                background: isEligible ? '#dcfce7' : '#fee2e2',
                color: isEligible ? '#15803d' : '#b91c1c',
                fontSize: 12,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isEligible ? <Check size={14} /> : <XCircle size={14} />}
              {isEligible ? 'Eligible to Start' : 'Action Required'}
            </div>
          </div>

          {/* Criteria Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {checkList.map((c) => (
              <div
                key={c.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: c.passed ? '#f8fafc' : '#fff1f2',
                  border: `1px solid ${c.passed ? '#e2e8f0' : '#fecdd3'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: c.passed ? '#dcfce7' : '#fee2e2',
                      color: c.passed ? '#16a34a' : '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {c.passed ? <Check size={14} /> : <XCircle size={14} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{c.label}</div>
                    {c.help && <div style={{ fontSize: 12, color: '#64748b' }}>{c.help}</div>}
                  </div>
                </div>

                {!c.passed && c.actionUrl && (
                  <Link
                    href={c.actionUrl}
                    className="btn btn-secondary"
                    style={{
                      fontSize: 12,
                      padding: '6px 12px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {c.actionText} →
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Reasons banner if ineligible */}
          {!isEligible && reasons.length > 0 && (
            <div
              style={{
                padding: '14px 18px',
                background: '#fff1f2',
                borderRadius: 10,
                border: '1px solid #fecdd3',
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} /> Assessment Prerequisites Missing:
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: '#b91c1c' }}>
                {reasons.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Attempts Remaining: <strong>{remainingAttempts}</strong> of {maxAttempts} · Configured Duration: <strong>{timeLimit} min</strong>
            </div>

            <button
              onClick={handleStart}
              disabled={!isEligible || starting || remainingAttempts <= 0}
              className="btn btn-gold"
              style={{
                fontSize: 14,
                padding: '12px 32px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                opacity: !isEligible || remainingAttempts <= 0 ? 0.6 : 1,
                cursor: !isEligible || remainingAttempts <= 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Play size={16} />
              {starting ? 'Starting Session…' : 'Start Official Assessment'}
            </button>
          </div>
        </div>
      )}

      {/* 2. IN-PROGRESS ACTIVE ASSESSMENT SESSION */}
      {activeSession && questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '20px 24px',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                Attempt #{activeSession.attempt_number || 1} · In Progress
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                Questions ({Object.keys(answers).length} of {questions.length} answered)
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="btn btn-gold"
                style={{ fontSize: 13.5, padding: '9px 24px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Send size={14} /> {submitting ? 'Submitting…' : 'Submit Official Assessment'}
              </button>
            </div>
          </div>

          {/* Question List */}
          {questions.map((q: any, idx: number) => {
            const currentAns = answers[q.id] || '';
            const isAnswered = Boolean(currentAns && currentAns.trim().length > 0);

            return (
              <div
                key={q.id}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '24px 28px',
                  border: `1px solid ${isAnswered ? '#c7d2fe' : 'var(--border)'}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      background: '#f1f5f9',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#475569',
                    }}
                  >
                    Question {idx + 1} of {questions.length} · {q.question_type} · {q.marks || 10} pts
                  </span>
                  {isAnswered && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Check size={12} /> Answered
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 16, lineHeight: 1.5 }}>
                  {q.question_text}
                </div>

                {/* Multiple Choice Options */}
                {q.question_type === 'MCQ' && Array.isArray(q.options) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((opt: any) => {
                      const selected = currentAns === opt.key;
                      return (
                        <label
                          key={opt.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            padding: '12px 16px',
                            borderRadius: 8,
                            border: `1.5px solid ${selected ? '#7c3aed' : '#e2e8f0'}`,
                            background: selected ? '#f5f3ff' : '#fff',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.key}
                            checked={selected}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                            style={{ accentColor: '#7c3aed' }}
                          />
                          <span style={{ fontSize: 13.5, color: selected ? '#5b21b6' : '#334155', fontWeight: selected ? 600 : 400 }}>
                            <strong>{opt.key}.</strong> {opt.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* True / False Options */}
                {q.question_type === 'TRUE_FALSE' && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['TRUE', 'FALSE'].map((val) => {
                      const selected = currentAns === val;
                      return (
                        <label
                          key={val}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            cursor: 'pointer',
                            padding: '12px 16px',
                            borderRadius: 8,
                            border: `1.5px solid ${selected ? '#7c3aed' : '#e2e8f0'}`,
                            background: selected ? '#f5f3ff' : '#fff',
                          }}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={val}
                            checked={selected}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                            style={{ accentColor: '#7c3aed' }}
                          />
                          <span style={{ fontSize: 14, fontWeight: 700, color: selected ? '#5b21b6' : '#334155' }}>
                            {val === 'TRUE' ? 'True' : 'False'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {q.question_type === 'SHORT_ANSWER' && (
                  <div>
                    <textarea
                      rows={4}
                      value={currentAns}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Type your concise, production-grade technical explanation here..."
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        padding: '12px 14px',
                        fontSize: 13.5,
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>
                      {currentAns.length} characters
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Bottom Submit Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              onClick={handleManualSubmit}
              disabled={submitting}
              className="btn btn-gold"
              style={{ fontSize: 14, padding: '12px 36px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Send size={15} /> {submitting ? 'Submitting…' : 'Submit Official Assessment'}
            </button>
          </div>
        </div>
      )}

      {/* 3. RESULT SCREEN (After submission) */}
      {resultSummary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Result Highlight Card */}
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '28px 32px',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 99,
                    background: resultSummary.passFail === 'PASS' ? '#dcfce7' : '#fee2e2',
                    color: resultSummary.passFail === 'PASS' ? '#166534' : '#991b1b',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {resultSummary.passFail === 'PASS' ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Submitted on {resultSummary.submittedAt ? new Date(resultSummary.submittedAt).toLocaleDateString() : 'Today'}
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                Official Assessment Result
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Score: <strong>{resultSummary.score}%</strong> · Correct:{' '}
                <strong>{resultSummary.correctCount || 0}</strong> of {resultSummary.totalQuestions || 0} · Time Taken:{' '}
                <strong>{Math.floor((resultSummary.timeTakenSeconds || 0) / 60)}m {(resultSummary.timeTakenSeconds || 0) % 60}s</strong>
              </p>
            </div>

            <div
              style={{
                background: resultSummary.passFail === 'PASS' ? '#f0fdf4' : '#fff1f2',
                border: `2px solid ${resultSummary.passFail === 'PASS' ? '#86efac' : '#fecdd3'}`,
                borderRadius: 14,
                padding: '16px 28px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: 4 }}>
                Final Score
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: resultSummary.passFail === 'PASS' ? '#15803d' : '#b91c1c',
                }}
              >
                {resultSummary.score}%
              </div>
            </div>
          </div>

          {/* Question Breakdown with Correct Answers & Explanations */}
          {Array.isArray(resultSummary.questionsReview) && (
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: '24px 28px',
                border: '1px solid var(--border)',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>
                Question Review & Technical Explanations
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {resultSummary.questionsReview.map((rev: any, idx: number) => (
                  <div
                    key={rev.id || idx}
                    style={{
                      padding: '18px 20px',
                      borderRadius: 10,
                      background: rev.is_correct ? '#f8fafc' : '#fff1f2',
                      border: `1px solid ${rev.is_correct ? '#e2e8f0' : '#fecdd3'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: rev.is_correct ? '#166534' : '#991b1b' }}>
                        Question {idx + 1} · {rev.marks_awarded} / {rev.max_marks} pts
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: rev.is_correct ? '#dcfce7' : '#fee2e2',
                          color: rev.is_correct ? '#166534' : '#b91c1c',
                        }}
                      >
                        {rev.is_correct ? 'CORRECT' : 'INCORRECT'}
                      </span>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                      {rev.question_text}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, marginBottom: 8 }}>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Your Answer: </span>
                        <strong>{rev.candidate_answer || '(No answer provided)'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#166534', fontWeight: 600 }}>Correct Answer: </span>
                        <strong style={{ color: '#166534' }}>{rev.correct_answer}</strong>
                      </div>
                    </div>

                    {rev.explanation && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '10px 14px',
                          background: '#fff',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          fontSize: 12,
                          color: '#475569',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Explanation:</strong> {rev.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Link
              href={`/candidate/targets/${targetId}`}
              className="btn btn-primary"
              style={{ fontSize: 13.5, padding: '10px 24px', textDecoration: 'none' }}
            >
              Return to Target Dashboard
            </Link>

            {remainingAttempts > 0 && isEligible && (
              <button
                onClick={handleStart}
                disabled={starting}
                className="btn btn-secondary"
                style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RotateCcw size={14} /> Retake Assessment ({remainingAttempts} attempts left)
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. PAST SESSIONS HISTORY */}
      {sessions.length > 0 && (
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: '22px 28px',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px', color: '#475569' }}>
            Official Assessment Attempt History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((s: any) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                    Attempt #{s.attempt_number || 1}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Status: {s.status} · Duration: {s.time_limit_minutes || 20}m ·{' '}
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'In Progress'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {s.score !== null ? (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: s.pass_fail === 'PASS' ? '#dcfce7' : '#fee2e2',
                        color: s.pass_fail === 'PASS' ? '#166534' : '#991b1b',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {s.score}% ({s.pass_fail || 'GRADED'})
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
