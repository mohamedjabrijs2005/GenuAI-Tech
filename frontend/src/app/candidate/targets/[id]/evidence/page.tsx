'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileCheck,
  Plus,
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Trash2,
  Save,
  Send,
  Info,
} from 'lucide-react';
import api from '@/lib/api';

export default function TargetEvidencePage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form fields
  const [selectedReqId, setSelectedReqId] = useState('');
  const [evidenceType, setEvidenceType] = useState('PROJECT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [fileHash, setFileHash] = useState('');

  const fetchEvidenceData = () => {
    setLoading(true);
    Promise.all([
      api.get(`/candidate-portal/targets/${targetId}`),
      api.get(`/candidate-portal/targets/${targetId}/evidence`),
    ])
      .then(([targetRes, evRes]) => {
        setTarget(targetRes.data?.target);
        const reqs = targetRes.data?.requirements || [];
        setRequirements(reqs);
        if (reqs.length > 0 && !selectedReqId) {
          setSelectedReqId(reqs[0].id);
        }
        setEvidenceList(evRes.data?.evidence || []);
      })
      .catch((err) => {
        console.error('Failed to load target evidence:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvidenceData();
  }, [targetId]);

  const handleSaveEvidence = async (action: 'DRAFT' | 'SUBMIT') => {
    if (!selectedReqId) {
      setFormError('Please select a target requirement.');
      return;
    }
    if (!title.trim()) {
      setFormError('Please enter an evidence title.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      await api.post(`/candidate-portal/targets/${targetId}/evidence`, {
        requirementId: selectedReqId,
        evidenceType,
        title: title.trim(),
        description: description.trim(),
        externalUrl: externalUrl.trim() || undefined,
        fileHash: fileHash.trim() || undefined,
        action,
      });

      setShowModal(false);
      setTitle('');
      setDescription('');
      setExternalUrl('');
      setFileHash('');
      fetchEvidenceData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to submit evidence.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawEvidence = async (evidenceId: string) => {
    if (!confirm('Are you sure you want to withdraw this evidence item?')) return;

    try {
      await api.post(`/candidate-portal/targets/${targetId}/evidence/${evidenceId}/withdraw`);
      fetchEvidenceData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to withdraw evidence.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Evidence Locker...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: 'rgba(234, 88, 12, 0.2)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fdba74',
                  textTransform: 'uppercase',
                }}
              >
                {target?.company_name} · Evidence Locker
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
              Target-Specific Evidence Locker
            </h1>
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 650 }}>
              Submit projects, code repositories, work samples, and credentials linked directly to <strong>{target?.vacancy_title}</strong> requirements.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError('');
              setShowModal(true);
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Submit Evidence</span>
          </button>
        </div>
      </div>

      {/* File Integrity Notice */}
      <div
        style={{
          padding: '16px 20px',
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          fontSize: 12.5,
          color: '#475569',
          lineHeight: 1.5,
        }}
      >
        <Shield size={20} style={{ flexShrink: 0, color: '#64748b', marginTop: 2 }} />
        <div>
          <strong>File Integrity Record Notice:</strong> A file integrity record or cryptographic hash records the submitted file version. It verifies that the document has not changed since submission, but does not prove document authenticity, certificate validity, or candidate competence. Competence is reviewed by hiring recruiters.
        </div>
      </div>

      {/* Evidence Items List */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Submitted & Draft Evidence Items ({evidenceList.length})
        </h2>

        {evidenceList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {evidenceList.map((ev) => {
              const isLocked = ['ACCEPTED', 'REJECTED'].includes(ev.review_status);
              const isDraft = ev.review_status === 'DRAFT';

              return (
                <div
                  key={ev.id}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 10,
                    background: '#fafaf9',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: '#e0e7ff',
                            color: '#3730a3',
                            textTransform: 'uppercase',
                          }}
                        >
                          {ev.evidence_type}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                          Requirement: {ev.requirement_name}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                        {ev.title}
                      </h3>
                      {ev.description && (
                        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>
                          {ev.description}
                        </p>
                      )}
                    </div>

                    {/* Review Status Badge */}
                    <div>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background:
                            ev.review_status === 'ACCEPTED'
                              ? '#ecfdf5'
                              : ev.review_status === 'LIMITED'
                              ? '#fef3c7'
                              : ev.review_status === 'MORE_INFORMATION_REQUESTED'
                              ? '#fff7ed'
                              : ev.review_status === 'DRAFT'
                              ? '#f1f5f9'
                              : '#eff6ff',
                          color:
                            ev.review_status === 'ACCEPTED'
                              ? '#059669'
                              : ev.review_status === 'LIMITED'
                              ? '#92400e'
                              : ev.review_status === 'MORE_INFORMATION_REQUESTED'
                              ? '#c2410c'
                              : ev.review_status === 'DRAFT'
                              ? '#64748b'
                              : '#2563eb',
                          border:
                            ev.review_status === 'ACCEPTED'
                              ? '1px solid #a7f3d0'
                              : ev.review_status === 'LIMITED'
                              ? '1px solid #fde68a'
                              : ev.review_status === 'MORE_INFORMATION_REQUESTED'
                              ? '1px solid #ffedd5'
                              : '1px solid var(--border)',
                        }}
                      >
                        {ev.review_status}
                      </span>
                    </div>
                  </div>

                  {/* Recruiter Reviewer Note (if candidate visible) */}
                  {ev.reviewer_note && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 6,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                        color: '#334155',
                      }}
                    >
                      <strong>Recruiter Note:</strong> {ev.reviewer_note}
                    </div>
                  )}

                  {/* Metadata & Actions */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      fontSize: 11.5,
                      color: '#64748b',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {ev.external_url && (
                        <a
                          href={ev.external_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <ExternalLink size={12} />
                          <span>View Artifact URL</span>
                        </a>
                      )}
                      <span>Submitted: {new Date(ev.created_at).toLocaleDateString()}</span>
                    </div>

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => handleWithdrawEvidence(ev.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: '3px 8px', color: '#ef4444' }}
                      >
                        Withdraw Item
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 20px', background: '#fafaf9', borderRadius: 8 }}>
            <FileCheck size={32} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
              No Evidence Items Submitted Yet
            </div>
            <p style={{ fontSize: 12.5, color: '#64748b', maxWidth: 440, margin: '0 auto 16px' }}>
              Select a vacancy requirement above and submit a project repository, work sample, or experience explanation.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
              style={{ fontSize: 12 }}
            >
              + Submit Evidence Item
            </button>
          </div>
        )}
      </div>

      {/* Evidence Submission Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 580,
              width: '100%',
              padding: '24px 28px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Submit Requirement Evidence
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#991b1b', fontSize: 12.5, marginBottom: 14 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Requirement Selection */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Target Requirement Supported
                </label>
                <select
                  className="input-field"
                  value={selectedReqId}
                  onChange={(e) => setSelectedReqId(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {requirements.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.importance || 'REQUIRED'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Evidence Type */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Evidence Type
                </label>
                <select
                  className="input-field"
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="PROJECT">Project / Repository</option>
                  <option value="WORK_SAMPLE">Work Sample / Code Snippet</option>
                  <option value="CERTIFICATE">Certification</option>
                  <option value="EXPERIENCE">Relevant Experience Explanation</option>
                  <option value="PORTFOLIO">Portfolio Item</option>
                  <option value="GITHUB">GitHub Repository Link</option>
                  <option value="OTHER">Other Accepted Proof</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Evidence Title
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Distributed Consensus Engine Implementation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Description & Context
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Explain how this artifact demonstrates the required skill and how you solved relevant engineering challenges..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* URL */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Artifact URL (GitHub, Demo, Document)
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://github.com/my-user/my-repo"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEvidence('DRAFT')}
                className="btn btn-secondary"
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Save size={14} />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveEvidence('SUBMIT')}
                className="btn btn-primary"
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Send size={14} />
                <span>{submitting ? 'Submitting...' : 'Submit for Review'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
