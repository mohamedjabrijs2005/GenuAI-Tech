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
} from 'lucide-react';
import api from '@/lib/api';

export default function TargetPracticePage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected question & quiz state
  const [activeReqIndex, setActiveReqIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get(`/candidate-portal/targets/${targetId}`)
      .then((res) => {
        if (!isMounted) return;
        setTarget(res.data?.target);
        setRequirements(res.data?.requirements || []);
      })
      .catch((err) => {
        console.error('Failed to load practice module:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetId]);

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

  const currentReq = requirements[activeReqIndex] || { name: 'General Engineering' };

  // Sample requirement-linked practice question
  const sampleQuestion = {
    title: `${currentReq.name} Practical Scenario Check`,
    prompt: `In a production system utilizing ${currentReq.name}, how would you ensure zero-downtime schema evolution and prevent connection pool saturation during peak throughput?`,
    options: [
      'Apply non-blocking additive migrations with backwards-compatible contract changes and tune max pool size with proper checkout timeouts.',
      'Lock the entire database cluster in exclusive mode for 5 minutes during peak hours.',
      'Delete the schema cache and restart all microservice containers synchronously without readiness probes.',
      'Increase thread stack size indefinitely to bypass memory limits.',
    ],
    correctIndex: 0,
    explanation:
      'Zero-downtime evolution requires non-blocking DDL changes, expand-and-contract schema migrations, and well-tuned connection pool ceilings with timeouts to prevent thread starvation.',
  };

  const handleOptionSubmit = () => {
    if (selectedOption === null) return;
    setSubmitted(true);
    setScore(selectedOption === sampleQuestion.correctIndex ? 1 : 0);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setSubmitted(false);
    setScore(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 99,
              background: 'rgba(16, 185, 129, 0.2)',
              fontSize: 11,
              fontWeight: 700,
              color: '#86efac',
              textTransform: 'uppercase',
            }}
          >
            Private Preparation Sandbox
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
          Interactive Practice Sandbox
        </h1>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>
          Self-check questions and scenario evaluations tailored to <strong>{target?.vacancy_title}</strong> competencies.
        </p>
      </div>

      {/* Privacy Notice */}
      <div
        style={{
          padding: '16px 20px',
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12.5,
          color: '#475569',
        }}
      >
        <Shield size={20} style={{ flexShrink: 0, color: '#64748b' }} />
        <div>
          <strong>Private Preparation:</strong> Practice exercises are for your personal skill improvement. Results are never visible to hiring recruiters and are completely separate from official company assessments.
        </div>
      </div>

      {/* Requirement Tabs */}
      {requirements.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {requirements.map((req, idx) => (
            <button
              key={req.id}
              type="button"
              onClick={() => {
                setActiveReqIndex(idx);
                handleReset();
              }}
              className={`btn ${activeReqIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap' }}
            >
              {req.name}
            </button>
          ))}
        </div>
      )}

      {/* Practice Sandbox Card */}
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
            {currentReq.name} Competency Check
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            style={{ fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <RefreshCw size={12} />
            <span>Reset Question</span>
          </button>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>
          {sampleQuestion.title}
        </h3>
        <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, marginBottom: 20 }}>
          {sampleQuestion.prompt}
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {sampleQuestion.options.map((opt, optIdx) => {
            const isSelected = selectedOption === optIdx;
            const isCorrect = optIdx === sampleQuestion.correctIndex;

            let bgColor = '#fafaf9';
            let borderColor = 'var(--border)';
            if (submitted) {
              if (isCorrect) {
                bgColor = '#ecfdf5';
                borderColor = '#10b981';
              } else if (isSelected && !isCorrect) {
                bgColor = '#fef2f2';
                borderColor = '#ef4444';
              }
            } else if (isSelected) {
              bgColor = '#eff6ff';
              borderColor = '#3b82f6';
            }

            return (
              <div
                key={optIdx}
                onClick={() => {
                  if (!submitted) setSelectedOption(optIdx);
                }}
                style={{
                  padding: '14px 18px',
                  borderRadius: 8,
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  cursor: submitted ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: isSelected ? '6px solid #3b82f6' : '2px solid #cbd5e1',
                    background: '#fff',
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.5 }}>{opt}</span>
              </div>
            );
          })}
        </div>

        {/* Submit / Feedback */}
        {!submitted ? (
          <button
            type="button"
            onClick={handleOptionSubmit}
            disabled={selectedOption === null}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700 }}
          >
            Check Answer
          </button>
        ) : (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 8,
              background: score === 1 ? '#ecfdf5' : '#fef2f2',
              border: score === 1 ? '1px solid #6ee7b7' : '1px solid #fecaca',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {score === 1 ? (
                <CheckCircle2 size={18} style={{ color: '#059669' }} />
              ) : (
                <AlertCircle size={18} style={{ color: '#dc2626' }} />
              )}
              <span style={{ fontSize: 14, fontWeight: 800, color: score === 1 ? '#065f46' : '#991b1b' }}>
                {score === 1 ? 'Correct! Strong understanding demonstrated.' : 'Not quite. Review the explanation below:'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
              {sampleQuestion.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
