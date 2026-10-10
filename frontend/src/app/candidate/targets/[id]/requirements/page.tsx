'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Layers,
  Shield,
  FileCheck,
  BookOpen,
  ClipboardCheck,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Plus,
  Info,
} from 'lucide-react';
import api from '@/lib/api';

export default function RequirementWorkspacePage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.get(`/candidate-portal/targets/${targetId}`),
      api.get(`/candidate-portal/targets/${targetId}/evidence`).catch(() => ({ data: { evidence: [] } })),
      api.get(`/candidate-portal/targets/${targetId}/coverage`).catch(() => ({ data: { coverage: null } })),
    ])
      .then(([targetRes, evRes, covRes]) => {
        if (!isMounted) return;
        setTarget(targetRes.data?.target);
        setRequirements(targetRes.data?.requirements || []);
        setEvidenceList(evRes.data?.evidence || []);
        setCoverage(covRes.data?.coverage || targetRes.data?.coverage);
      })
      .catch((err) => {
        console.error('Failed to load requirement workspace:', err);
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
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Requirement Workspace...</div>
        </div>
      </div>
    );
  }

  const getRequirementEvidence = (reqId: string) => {
    return evidenceList.filter((e) => e.requirement_id === reqId);
  };

  const getCoverageState = (reqId: string) => {
    const ev = getRequirementEvidence(reqId);
    if (ev.some((e) => e.review_status === 'ACCEPTED')) return 'SUPPORTED';
    if (ev.some((e) => e.review_status === 'LIMITED')) return 'LIMITED';
    if (ev.some((e) => e.review_status === 'SUBMITTED' || e.review_status === 'UNDER_REVIEW')) return 'PENDING';
    return 'EVIDENCE_GAP';
  };

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

      {/* Header Banner */}
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
                  background: 'rgba(59, 130, 246, 0.2)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#93c5fd',
                  textTransform: 'uppercase',
                }}
              >
                {target?.company_name} · {target?.vacancy_title}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
              Requirement Workspace
            </h1>
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 650 }}>
              GenuAI organizes candidate capability requirement by requirement instead of relying on a vague resume screening score.
            </p>
          </div>

          <Link
            href={`/candidate/targets/${targetId}/evidence`}
            className="btn btn-primary"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={15} />
            <span>Submit New Evidence</span>
          </Link>
        </div>
      </div>

      {/* Truthful Evidence Gap Statement */}
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
        <Info size={20} style={{ flexShrink: 0, color: '#64748b' }} />
        <span>
          <strong>Evidence Gap Clarification:</strong> An <em>Evidence Gap</em> means sufficient supporting evidence is not currently available for this requirement. It does not mean you do not have the skill.
        </span>
      </div>

      {/* Requirements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {requirements.map((req, idx) => {
          const reqEvidence = getRequirementEvidence(req.id);
          const state = getCoverageState(req.id);
          const isRequired = (req.importance || 'REQUIRED').toUpperCase() === 'REQUIRED';

          return (
            <div
              key={req.id}
              className="card"
              style={{
                padding: '22px 24px',
                borderLeft: isRequired ? '4px solid #ef4444' : '4px solid #d4af37',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>#{idx + 1}</span>
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {req.name}
                    </h3>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: isRequired ? '#fee2e2' : '#fef3c7',
                        color: isRequired ? '#991b1b' : '#92400e',
                      }}
                    >
                      {req.importance || 'REQUIRED'}
                    </span>
                  </div>
                  {req.description && (
                    <div style={{ fontSize: 13, color: '#475569', maxWidth: 650 }}>{req.description}</div>
                  )}
                </div>

                {/* State Badge */}
                <div>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background:
                        state === 'SUPPORTED'
                          ? '#ecfdf5'
                          : state === 'PENDING'
                          ? '#eff6ff'
                          : state === 'LIMITED'
                          ? '#fef3c7'
                          : '#f1f5f9',
                      color:
                        state === 'SUPPORTED'
                          ? '#059669'
                          : state === 'PENDING'
                          ? '#2563eb'
                          : state === 'LIMITED'
                          ? '#92400e'
                          : '#64748b',
                      border:
                        state === 'SUPPORTED'
                          ? '1px solid #a7f3d0'
                          : state === 'PENDING'
                          ? '1px solid #bfdbfe'
                          : state === 'LIMITED'
                          ? '1px solid #fde68a'
                          : '1px solid #e2e8f0',
                    }}
                  >
                    {state === 'SUPPORTED'
                      ? 'Supported'
                      : state === 'PENDING'
                      ? 'Pending Review'
                      : state === 'LIMITED'
                      ? 'Limited Evidence'
                      : 'Evidence Gap'}
                  </span>
                </div>
              </div>

              {/* Requirement Preparation Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10,
                  marginTop: 14,
                  padding: '12px 14px',
                  background: '#fafaf9',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>LEARNING</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                    <Link
                      href={`/candidate/targets/${targetId}/learn`}
                      style={{ color: 'var(--primary)', textDecoration: 'none' }}
                    >
                      Study Guides →
                    </Link>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>PRACTICE</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                    <Link
                      href={`/candidate/targets/${targetId}/practice`}
                      style={{ color: 'var(--primary)', textDecoration: 'none' }}
                    >
                      Self-Check Quiz →
                    </Link>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>SUBMITTED EVIDENCE</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                    {reqEvidence.length} item(s) submitted
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>NEXT ACTION</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>
                    <Link
                      href={`/candidate/targets/${targetId}/evidence`}
                      style={{ color: 'var(--primary)', textDecoration: 'none' }}
                    >
                      {reqEvidence.length === 0 ? '+ Submit Evidence' : 'View in Locker →'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
