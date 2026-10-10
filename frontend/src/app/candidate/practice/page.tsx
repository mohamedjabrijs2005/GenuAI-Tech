'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck, CheckCircle2, XCircle, ArrowRight, RefreshCw,
  Award, Play, HelpCircle, Code, Lightbulb, Check, AlertCircle
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
    explanation: 'A partial index indexes only the rows matching the predicate (`status = \'PENDING\'`), remaining lightweight and fast for high selectivity workloads.',
  },
];

export default function CandidatePracticePage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQ = PRACTICE_QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentIdx < PRACTICE_QUESTIONS.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      toast.success('Practice preview session completed.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Preview Banner */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12.5,
          color: '#475569',
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 4,
            background: '#f1f5f9',
            color: '#64748b',
            textTransform: 'uppercase',
            border: '1px solid #cbd5e1',
          }}
        >
          Preview Module
        </span>
        <span>
          <strong>In Development (Phase 2):</strong> Interactive readiness sandboxes are a simulation prototype. Practice sessions are non-scored self-checks and do not alter official candidate records.
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>
          Interactive Practice Sandbox
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
          Test your comprehension against technical scenarios before official assessment sessions.
        </p>
      </div>

      {/* Sandbox Question Card */}
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge badge-yellow" style={{ fontSize: 11 }}>
            {currentQ.requirement}
          </span>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            Question {currentIdx + 1} of {PRACTICE_QUESTIONS.length}
          </span>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
          {currentQ.question}
        </h3>

        {currentQ.codeSnippet && (
          <pre style={{ background: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 12, overflowX: 'auto', margin: 0 }}>
            <code>{currentQ.codeSnippet}</code>
          </pre>
        )}

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQ.options.map((opt, i) => {
            const isCorrect = i === currentQ.correctIndex;
            const isSelected = i === selectedOpt;

            let border = '1px solid var(--border)';
            let bg = '#ffffff';

            if (isAnswered) {
              if (isCorrect) {
                border = '1.5px solid #059669';
                bg = '#f0fdf4';
              } else if (isSelected) {
                border = '1.5px solid #dc2626';
                bg = '#fef2f2';
              }
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(i)}
                disabled={isAnswered}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border,
                  background: bg,
                  textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontWeight: 700, color: '#854d0e', width: 20 }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
                {isAnswered && isCorrect && <CheckCircle2 size={16} style={{ color: '#059669' }} />}
                {isAnswered && isSelected && !isCorrect && <XCircle size={16} style={{ color: '#dc2626' }} />}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && (
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12.5, color: '#334155' }}>
            <strong>Explanation:</strong> {currentQ.explanation}
          </div>
        )}

        {/* Next Button */}
        {isAnswered && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
              style={{
                background: '#b8860b',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                padding: '8px 18px',
              }}
            >
              <span>{currentIdx < PRACTICE_QUESTIONS.length - 1 ? 'Next Question' : 'Finish Practice'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
