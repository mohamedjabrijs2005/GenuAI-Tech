'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Accessibility,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Send,
  HelpCircle,
  Info,
} from 'lucide-react';
import api from '@/lib/api';

export default function CandidateAccessibilityPage() {
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form
  const [requestType, setRequestType] = useState('TIME_EXTENSION');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [description, setDescription] = useState('');

  const fetchAccommodations = () => {
    setLoading(true);
    Promise.all([
      api.get('/candidate-portal/accommodations'),
      api.get('/candidate-portal/targets').catch(() => ({ data: { targets: [] } })),
    ])
      .then(([accommRes, targetRes]) => {
        setAccommodations(accommRes.data?.accommodations || []);
        setTargets(targetRes.data?.targets || []);
      })
      .catch((err) => {
        console.error('Failed to load accommodations:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please describe your accommodation request.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/candidate-portal/accommodations', {
        requestType,
        targetId: selectedTargetId || undefined,
        description: description.trim(),
      });

      setSuccessMsg('Accommodation request submitted successfully. Our coordination team will review it with complete confidentiality.');
      setDescription('');
      fetchAccommodations();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit accommodation request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Accessibility & Accommodations...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
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
              background: 'rgba(59, 130, 246, 0.2)',
              fontSize: 11,
              fontWeight: 700,
              color: '#93c5fd',
              textTransform: 'uppercase',
            }}
          >
            Inclusive Hiring & Universal Design
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
          Accessibility & Accommodations
        </h1>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 650 }}>
          GenuAI is committed to accessible recruitment. Request evaluation adjustments, time extensions, or assistive technology compatibility without unnecessary medical disclosure.
        </p>
      </div>

      {/* Commitments Box */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>
          Universal Accessibility Standards
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ padding: '12px 14px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 2 }}>Keyboard Navigation</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>All workflows and assessment inputs are fully operable via keyboard.</div>
          </div>
          <div style={{ padding: '12px 14px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 2 }}>Screen Reader Support</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Semantic HTML, ARIA landmarks, and descriptive labels on all controls.</div>
          </div>
          <div style={{ padding: '12px 14px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 2 }}>Time Adjustments</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>1.5x and 2.0x time extensions for timed assessments upon request.</div>
          </div>
        </div>
      </div>

      {/* Accommodation Request Form */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Submit Confidential Accommodation Request
        </h2>
        <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 16px' }}>
          Your request is handled confidentially and does not negatively influence candidate evaluation.
        </p>

        {successMsg && (
          <div
            style={{
              padding: '12px 16px',
              background: '#ecfdf5',
              border: '1px solid #6ee7b7',
              borderRadius: 8,
              color: '#065f46',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#991b1b',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Accommodation Type
              </label>
              <select
                className="input-field"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="TIME_EXTENSION">Time Extension (e.g. 1.5x for coding assessment)</option>
                <option value="SCREEN_READER_ASSISTANCE">Screen Reader / Voice Tool Compatibility</option>
                <option value="ALTERNATIVE_FORMAT">Alternative Assessment Format (Take-home / Written)</option>
                <option value="INTERVIEW_ACCOMMODATION">Interview Captions / Sign Language Interpreter</option>
                <option value="GENERAL">General Workplace Accommodation</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Target Context (Optional)
              </label>
              <select
                className="input-field"
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Applies across all targets / global</option>
                {targets.map((t) => (
                  <option key={t.target_id} value={t.target_id}>
                    {t.vacancy_title} ({t.company_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Description of Accommodation Needed
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Describe the adjustment that would best support your evaluation (e.g. additional time, high-contrast editor, live captioning for interviews)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Send size={14} />
              <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Submitted Requests History */}
      {accommodations.length > 0 && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
            Your Accommodation Requests ({accommodations.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accommodations.map((acc) => (
              <div
                key={acc.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 8,
                  background: '#fafaf9',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {acc.request_type.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#475569' }}>{acc.description}</div>
                  {acc.vacancy_title && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      Target: {acc.vacancy_title} ({acc.company_name})
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: acc.status === 'APPROVED' ? '#ecfdf5' : '#eff6ff',
                    color: acc.status === 'APPROVED' ? '#059669' : '#2563eb',
                  }}
                >
                  {acc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
