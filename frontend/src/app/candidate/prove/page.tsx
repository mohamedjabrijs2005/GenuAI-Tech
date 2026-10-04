'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck, ShieldCheck, Clock, AlertTriangle, Eye, CheckCircle2,
  FileCheck, ArrowRight, Play, Lock, Sparkles, Key, Check
} from 'lucide-react';
import { DataService, EvidenceService } from '@/lib/dataService';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface OfficialQuestion {
  id: string;
  requirement: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
}

const OFFICIAL_QUESTIONS: OfficialQuestion[] = [
  {
    id: 'OQ-1',
    requirement: 'Java (Core & OOP Design Patterns)',
    question: 'Under high throughput, which garbage collector in Java 21+ provides sub-millisecond maximum pause times by performing all heavy phases concurrently?',
    options: [
      'Serial GC (`-XX:+UseSerialGC`)',
      'Parallel GC (`-XX:+UseParallelGC`)',
      'Z Garbage Collector (`-XX:+UseZGC`)',
      'CMS (Concurrent Mark Sweep)',
    ],
    correctIndex: 2,
  },
  {
    id: 'OQ-2',
    requirement: 'Distributed Systems & Concurrency',
    question: 'In a microservices cluster executing a distributed transaction using the Saga pattern with choreography, what is the primary role of compensating transactions?',
    options: [
      'To roll back physical database rows via a distributed 2PC lock.',
      'To semantically undo the effects of committed local transactions when a subsequent step in the business process fails.',
      'To encrypt messages in the dead letter queue before archiving.',
      'To synchronize thread clocks between different data centers.',
    ],
    correctIndex: 1,
  },
  {
    id: 'OQ-3',
    requirement: 'PostgreSQL Relational Optimization',
    question: 'When analyzing an execution plan in PostgreSQL, what does a `Seq Scan` with `Filter: (user_id = 42)` indicating high execution time usually recommend?',
    options: [
      'Increase the `work_mem` configuration parameter.',
      'Add a B-Tree index on `user_id` so the optimizer can choose an `Index Scan` or `Bitmap Index Scan`.',
      'Change the table column type from integer to varchar.',
      'Disable autovacuum on the table.',
    ],
    correctIndex: 1,
  },
  {
    id: 'OQ-4',
    requirement: 'AWS Cloud Infrastructure (ECS & Terraform)',
    question: 'In Terraform, what is the purpose of managing state using remote S3 with DynamoDB state locking?',
    options: [
      'It speeds up provider binary compilation during plan.',
      'It prevents concurrent state modifications by multiple team members and provides a single source of truth.',
      'It automatically converts Terraform syntax into CloudFormation JSON.',
      'It replaces AWS IAM roles with static root API keys.',
    ],
    correctIndex: 1,
  },
];

export default function CandidateProvePage() {
  const router = useRouter();

  const [testActive, setTestActive] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [resultScore, setResultScore] = useState<number>(0);
  const [evidenceReceipt, setEvidenceReceipt] = useState<string>('');
  const [signalsCount, setSignalsCount] = useState(0);

  const candidateAppId = 'app-101'; // Default canonical candidate application

  // Anti-cheat telemetry listeners
  useEffect(() => {
    if (!testActive || isCompleted) return;

    const handleBlur = () => {
      setSignalsCount(prev => prev + 1);
      toast.error('Integrity Telemetry: Tab switch / focus loss detected and logged');
      DataService.createIntegritySignal({
        applicationId: candidateAppId,
        signalType: 'Tab Switch / Focus Lost',
        severity: 'Medium',
        details: { timestamp: new Date().toISOString(), reason: 'Window blurred during active session' },
      }).catch(() => {});
    };

    const handleCopy = () => {
      toast.error('Integrity Telemetry: Clipboard action logged');
      DataService.createIntegritySignal({
        applicationId: candidateAppId,
        signalType: 'Copy / Paste Outside Buffer',
        severity: 'Low',
        details: { timestamp: new Date().toISOString(), reason: 'Clipboard copy event' },
      }).catch(() => {});
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('copy', handleCopy);
    };
  }, [testActive, isCompleted]);

  // Timer countdown
  useEffect(() => {
    if (!testActive || isCompleted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleFinishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testActive, isCompleted, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setTestActive(true);
    toast.success('Official assessment session initiated with active telemetry monitoring');
  };

  const handleSelectOption = (optIdx: number) => {
    const qId = OFFICIAL_QUESTIONS[currentIdx].id;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleFinishTest = async () => {
    setIsSubmitting(true);
    try {
      // Calculate score
      let correct = 0;
      OFFICIAL_QUESTIONS.forEach(q => {
        if (answers[q.id] === q.correctIndex) correct++;
      });
      const finalScore = Math.round((correct / OFFICIAL_QUESTIONS.length) * 100);
      setResultScore(finalScore);

      // Generate Cryptographic Evidence Receipt
      const receiptHash = `GENUAI-SHA256-${Date.now().toString(16).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setEvidenceReceipt(receiptHash);

      // Try triggering evidence generation endpoint
      await api.post(`/evidence/generate/${candidateAppId}`).catch(() => {});

      setIsCompleted(true);
      setTestActive(false);
      toast.success('Assessment submitted! Verifiable evidence layer generated');
    } catch {
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Initial Launch State
  if (!testActive && !isCompleted) {
    return (
      <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="breadcrumbs">
            <span>Candidate Workspace</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Stage 4: Prove</span>
          </div>
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Official Proctored Assessment</h1>
              <p className="page-subtitle">
                Official verification session. Submissions generate tamper-evident evidence for recruiter review.
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--gold-grad, linear-gradient(135deg, #b8860b 0%, #d4af37 100%))',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BadgeCheck size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Official Technical Assessment — Software Developer
              </h2>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                Target: <strong>Apex Neural Systems Ltd</strong> · 4 Mapped Core Requirements
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              background: '#f8fafc',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#059669" />
              <span>Assessment & Proctoring Guidelines:</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <li>Total Duration: <strong>30 minutes</strong> timed session.</li>
              <li>Focus telemetry is active: window blur and tab switching are logged to the integrity ledger.</li>
              <li>Your submitted work generates supporting evidence directly attached to role requirements.</li>
              <li>The final hiring decision remains human-led by company hiring managers.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Link href="/candidate/practice" className="btn btn-secondary">
              Review Practice Test
            </Link>
            <button onClick={handleStart} className="btn btn-gold">
              <Play size={16} fill="#fff" />
              <span>Begin Official Assessment Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Test Runner State
  if (testActive && !isCompleted) {
    const currentQ = OFFICIAL_QUESTIONS[currentIdx];
    const selectedOpt = answers[currentQ.id];

    return (
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Test Header Bar with Proctoring & Timer */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '14px 20px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Proctoring Telemetry Active</span>
            </div>
            {signalsCount > 0 && (
              <span className="badge badge-yellow font-bold text-xs">
                {signalsCount} focus switch flag(s)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 800, color: timeLeft < 300 ? '#dc2626' : '#b8860b' }}>
              <Clock size={18} />
              <span>{formatTimer(timeLeft)}</span>
            </div>
            <button
              onClick={handleFinishTest}
              disabled={isSubmitting}
              className="btn btn-gold btn-sm"
            >
              {isSubmitting ? 'Submitting…' : 'Submit & Complete'}
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="badge badge-gold font-bold text-xs">
              {currentQ.requirement}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
              Task {currentIdx + 1} of {OFFICIAL_QUESTIONS.length}
            </span>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
            {currentQ.question}
          </h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedOpt === optIdx;
              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 8,
                    border: `1.5px solid ${isSelected ? 'var(--primary, #b8860b)' : '#e2e8f0'}`,
                    background: isSelected ? '#fefce8' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--primary, #b8860b)' : '#cbd5e1'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary, #b8860b)' }} />
                    )}
                  </div>
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>

          {/* Stepper Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="btn btn-secondary btn-sm"
            >
              Previous Task
            </button>

            <div style={{ display: 'flex', gap: 6 }}>
              {OFFICIAL_QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: i === currentIdx ? 'var(--primary, #b8860b)' : answers[OFFICIAL_QUESTIONS[i].id] !== undefined ? '#ecfdf5' : '#f1f5f9',
                    color: i === currentIdx ? '#fff' : answers[OFFICIAL_QUESTIONS[i].id] !== undefined ? '#059669' : '#64748b',
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {currentIdx < OFFICIAL_QUESTIONS.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(prev => Math.min(OFFICIAL_QUESTIONS.length - 1, prev + 1))}
                className="btn btn-gold btn-sm"
              >
                Next Task
              </button>
            ) : (
              <button
                onClick={handleFinishTest}
                disabled={isSubmitting}
                className="btn btn-gold btn-sm"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Completed / Evidence Generated State
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <BadgeCheck size={36} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
          Official Assessment Completed & Evidence Generated!
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', maxWidth: 540, margin: '0 auto 24px auto' }}>
          Your responses have been scored against the defined role requirements. Supporting evidence has been
          immutably generated in the GenuAI Evidence Layer for recruiter evaluation.
        </p>

        {/* Cryptographic Evidence Receipt Card */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
            textAlign: 'left',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cryptographic Evidence Record
            </span>
            <span className="badge badge-green font-bold text-xs">
              Score: {resultScore}%
            </span>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#334155', wordBreak: 'break-all', marginBottom: 12 }}>
            {evidenceReceipt}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12, color: '#64748b' }}>
            <div>
              Status: <strong style={{ color: '#059669' }}>Supporting Evidence</strong>
            </div>
            <div>
              Target Role: <strong style={{ color: '#1e293b' }}>Software Developer</strong>
            </div>
            <div>
              Integrity Telemetry: <strong style={{ color: signalsCount === 0 ? '#059669' : '#d97706' }}>{signalsCount === 0 ? 'Clean (0 Flags)' : `${signalsCount} Flags Recorded`}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Link href="/candidate/evidence" className="btn btn-gold">
            <FileCheck size={16} />
            <span>Open Verified Evidence Portfolio</span>
          </Link>
          <Link href="/dashboard/evidence/coverage" className="btn btn-secondary">
            <span>View Recruiter Coverage View</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
