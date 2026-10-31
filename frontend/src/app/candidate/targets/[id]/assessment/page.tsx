'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BadgeCheck, ArrowLeft, Play, Send, Info, RotateCcw, CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function statusStyle(s: string) {
  if (s === 'FULLY_GRADED' || s === 'COMPLETED') return { bg: '#dcfce7', color: '#166534' };
  if (s === 'SUBMITTED' || s === 'PARTIALLY_GRADED') return { bg: '#eff6ff', color: '#1e40af' };
  if (s === 'IN_PROGRESS') return { bg: '#fef3c7', color: '#b45309' };
  return { bg: '#f1f5f9', color: '#475569' };
}

export default function TargetAssessmentPage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/candidate-portal/targets/${targetId}/assessment`);
      setData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (targetId) load(); }, [targetId]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await api.post(`/candidate-portal/targets/${targetId}/assessment/start`);
      toast.success('Assessment started');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start assessment');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (!data?.attempt?.id) return;
    if (!window.confirm('Submit your assessment? You cannot change answers after submission.')) return;
    setSubmitting(true);
    try {
      await api.post(`/candidate-portal/targets/${targetId}/assessment/submit`, {
        attemptId: data.attempt.id,
        answers,
      });
      toast.success('Assessment submitted successfully!');
      setAnswers({});
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <div className="spinner" />
    </div>
  );

  const attempt = data?.attempt;
  const questions = data?.questions || [];
  const prevAttempts = data?.attempts || [];
  const status = attempt?.status || data?.status || 'AVAILABLE';
  const ss = statusStyle(status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
      <Link href={`/candidate/targets/${targetId}`} style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to Target Workspace
      </Link>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '26px 30px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ padding: '3px 10px', borderRadius: 99, background: '#f5f3ff', border: '1px solid #ede9fe', fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>Official Assessment</span>
              <span style={{ padding: '3px 10px', borderRadius: 99, background: ss.bg, fontSize: 11, fontWeight: 700, color: ss.color }}>{status}</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 6px' }}>Prove: Official Assessment</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Company-configured evaluation. Results are visible to the recruiter after grading.</p>
          </div>
          {attempt?.score != null && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Your Score</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#16a34a' }}>{attempt.score}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Policy */}
      <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', display: 'flex', gap: 8, fontSize: 12.5, color: '#1e40af' }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Multiple attempts allowed. Only your latest valid submission is used for readiness evaluation. Recruiters cannot see your private practice attempts.</span>
      </div>

      {/* Start */}
      {(status === 'AVAILABLE' || status === 'NOT_STARTED' || status === 'NOT_REQUIRED') && (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <BadgeCheck size={40} style={{ color: '#7c3aed', margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Ready to Prove Your Skills?</h2>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Start the official assessment session. Your answers will be evaluated against the role rubric and scored by the recruiter.
          </p>
          <button onClick={handleStart} disabled={starting} className="btn btn-gold" style={{ fontSize: 14, padding: '10px 28px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Play size={15} /> {starting ? 'Starting…' : 'Start Assessment Session'}
          </button>
        </div>
      )}

      {/* Active session */}
      {status === 'IN_PROGRESS' && questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Answer Questions ({questions.length})</h2>
          {questions.map((q: any, idx: number) => (
            <div key={q.id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>Q{idx + 1} · {q.topic_area || 'General'}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>{q.prompt || q.title}</div>
              {q.question_type === 'MCQ' && q.options?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((opt: any) => (
                    <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1px solid ${answers[q.id] === opt.key ? '#7c3aed' : '#e2e8f0'}`, background: answers[q.id] === opt.key ? '#f5f3ff' : '#fff' }}>
                      <input type="radio" name={q.id} value={opt.key} checked={answers[q.id] === opt.key} onChange={() => setAnswers(a => ({ ...a, [q.id]: opt.key }))} />
                      <span style={{ fontSize: 13 }}>{opt.text}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea rows={4} value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} placeholder="Write your answer here..." style={{ width: '100%', borderRadius: 8, border: '1px solid #e2e8f0', padding: '10px 14px', fontSize: 13, resize: 'vertical' }} />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSubmit} disabled={submitting} className="btn btn-gold" style={{ fontSize: 14, padding: '10px 28px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Send size={14} /> {submitting ? 'Submitting…' : 'Submit Assessment'}
            </button>
          </div>
        </div>
      )}

      {/* Submitted */}
      {['SUBMITTED', 'FULLY_GRADED', 'PARTIALLY_GRADED'].includes(status) && (
        <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
          <CheckCircle2 size={36} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Assessment Submitted</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Status: <strong>{status}</strong>{attempt?.submitted_at ? ` · ${new Date(attempt.submitted_at).toLocaleDateString()}` : ''}
          </p>
          <button onClick={handleStart} disabled={starting} className="btn btn-secondary" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={13} /> {starting ? 'Starting…' : 'Start New Attempt'}
          </button>
        </div>
      )}

      {/* Attempt history */}
      {prevAttempts.length > 0 && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attempt History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prevAttempts.map((a: any, i: number) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Attempt #{prevAttempts.length - i}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{a.status}{a.score != null ? ` · ${a.score}%` : ''}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : 'In Progress'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href={`/candidate/targets/${targetId}/evidence`} className="btn btn-primary" style={{ textDecoration: 'none', alignSelf: 'flex-start', fontSize: 13 }}>
        Next: Submit Evidence →
      </Link>
    </div>
  );
}
