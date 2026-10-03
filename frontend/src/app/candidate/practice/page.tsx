'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck, CheckCircle2, XCircle, ArrowRight, RefreshCw,
  Award, Play, HelpCircle, Code, Lightbulb, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PracticeQuestion {
  id: string;
  requirement: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'PQ-1',
    requirement: 'Java (Core & OOP Design Patterns)',
    question: 'In Java, how does declaring a field as `volatile` affect read and write operations across concurrent threads under the Java Memory Model (JMM)?',
    codeSnippet: 'private volatile boolean running = true;',
    options: [
      'It ensures atomicity of composite operations like `count++` without locks.',
      'It establishes a happens-before relationship, guaranteeing changes are immediately visible to all threads without CPU register caching.',
      'It creates an exclusive lock on the object containing the variable for the thread reading it.',
      'It prevents the variable from being serialized during remote invocation.',
    ],
    correctIndex: 1,
    explanation: 'The `volatile` keyword ensures visibility and memory ordering by enforcing a happens-before relationship, bypassing CPU caches. It does NOT guarantee atomicity for compound operations like `i++`.',
  },
  {
    id: 'PQ-2',
    requirement: 'Distributed Systems & Concurrency',
    question: 'When designing a distributed payment processor where the same webhook might be delivered multiple times, which design pattern best ensures idempotency?',
    options: [
      'Rely solely on TCP retries and discard packets with duplicate sequence numbers.',
      'Store unique idempotency keys in a fast key-value store with atomic `SETNX` and verify before executing financial ledger writes.',
      'Increase server memory to buffer duplicate requests in a local queue.',
      'Wrap all incoming HTTP requests in a single distributed 2-phase commit transaction.',
    ],
    correctIndex: 1,
    explanation: 'An idempotency key pattern using atomic `SETNX` (or unique database constraints) verifies whether a transaction was already initiated, safely returning the cached response if retried.',
  },
  {
    id: 'PQ-3',
    requirement: 'PostgreSQL Relational Optimization',
    question: 'Given a table with 10M rows where 98% of rows have `status = \'ARCHIVED\'` and only 2% have `status = \'PENDING\'`, which indexing strategy is most efficient for queries looking for pending rows?',
    codeSnippet: 'SELECT id, payload FROM tasks WHERE status = \'PENDING\';',
    options: [
      'Create a full B-Tree index on `(status, id)`.',
      'Create a Partial Index: `CREATE INDEX idx_pending_tasks ON tasks (id) WHERE status = \'PENDING\';`',
      'Run `VACUUM FULL` every hour to defragment the table.',
      'Convert the table to a GIN index without a WHERE clause.',
    ],
    correctIndex: 1,
    explanation: 'A Partial Index covers only the 2% of active rows, taking a fraction of the RAM/disk footprint of a full index and avoiding unnecessary B-Tree updates for archived records.',
  },
];

export default function CandidatePracticePage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < PRACTICE_QUESTIONS.length) {
      toast.error('Please answer all practice questions before scoring');
      return;
    }
    setSubmitted(true);
    toast.success('Practice assessment completed!');
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const correctCount = PRACTICE_QUESTIONS.filter(
    q => answers[q.id] === q.correctIndex
  ).length;

  const scorePct = Math.round((correctCount / PRACTICE_QUESTIONS.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stage Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="breadcrumbs">
          <span>Candidate Workspace</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Stage 3: Practice</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Interactive Capability Sandbox</h1>
            <p className="page-subtitle">
              Verify your readiness against official vacancy requirements with instant feedback.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {submitted && (
              <button onClick={handleReset} className="btn btn-secondary btn-sm">
                <RefreshCw size={14} />
                <span>Retry Practice</span>
              </button>
            )}
            <Link href="/candidate/prove" className="btn btn-gold btn-sm">
              <Play size={14} fill="#fff" />
              <span>Next: Stage 4 Prove</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Score Summary Banner if submitted */}
      {submitted && (
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 12,
            background: scorePct >= 70 ? '#ecfdf5' : '#fffbeb',
            border: `1px solid ${scorePct >= 70 ? '#a7f3d0' : '#fde68a'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: scorePct >= 70 ? '#059669' : '#d97706',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {scorePct}%
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {scorePct >= 70 ? 'Readiness Standard Achieved!' : 'Further Preparation Recommended'}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                You scored {correctCount} of {PRACTICE_QUESTIONS.length} correct across the targeted requirement rubrics.
              </div>
            </div>
          </div>

          <Link href="/candidate/prove" className="btn btn-gold btn-sm">
            <span>Proceed to Official Assessment</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PRACTICE_QUESTIONS.map((q, idx) => {
          const selected = answers[q.id];
          const isCorrect = submitted && selected === q.correctIndex;
          const isWrong = submitted && selected !== undefined && selected !== q.correctIndex;

          return (
            <div key={q.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="badge badge-yellow font-bold text-xs">
                  {q.requirement}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
                  Question {idx + 1} of {PRACTICE_QUESTIONS.length}
                </span>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                {q.question}
              </h3>

              {q.codeSnippet && (
                <div
                  style={{
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    padding: '10px 14px',
                    borderRadius: 6,
                    marginBottom: 14,
                    overflowX: 'auto',
                  }}
                >
                  {q.codeSnippet}
                </div>
              )}

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt, optIdx) => {
                  const isOptionSelected = selected === optIdx;
                  let bg = '#fff';
                  let border = '#e2e8f0';

                  if (submitted) {
                    if (optIdx === q.correctIndex) {
                      bg = '#ecfdf5';
                      border = '#059669';
                    } else if (isOptionSelected) {
                      bg = '#fef2f2';
                      border = '#dc2626';
                    }
                  } else if (isOptionSelected) {
                    bg = '#fefce8';
                    border = 'var(--primary, #b8860b)';
                  }

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelect(q.id, optIdx)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: `1px solid ${border}`,
                        background: bg,
                        cursor: submitted ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 13.5,
                        color: 'var(--text-primary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: `2px solid ${isOptionSelected ? 'var(--primary, #b8860b)' : '#cbd5e1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isOptionSelected && (
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary, #b8860b)' }} />
                          )}
                        </div>
                        <span>{opt}</span>
                      </div>

                      {submitted && optIdx === q.correctIndex && (
                        <CheckCircle2 size={16} color="#059669" />
                      )}
                      {submitted && isOptionSelected && optIdx !== q.correctIndex && (
                        <XCircle size={16} color="#dc2626" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation after submission */}
              {submitted && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: 12.5,
                    color: '#475569',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>Explanation: </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Action */}
      {!submitted && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={handleSubmit} className="btn btn-gold">
            Submit & Verify Readiness
          </button>
        </div>
      )}
    </div>
  );
}
