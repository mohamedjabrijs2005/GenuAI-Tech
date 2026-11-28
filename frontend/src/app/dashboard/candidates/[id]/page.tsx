'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  User, CheckCircle2, AlertTriangle, Clock, ArrowLeft,
  Briefcase, Award, MessageSquare, Calendar, ChevronRight,
  AlertCircle, RefreshCw, Building2, Mail, Phone, MapPin,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params?.id as string;

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    api.get(`/candidates/${candidateId}`)
      .then(res => setCandidate(res.data?.candidate || res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load candidate'))
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );

  if (error || !candidate) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <AlertCircle size={36} style={{ color: '#dc2626', marginBottom: 12 }} />
      <p style={{ color: '#dc2626', marginBottom: 16 }}>{error || 'Candidate not found'}</p>
      <button className="btn btn-secondary" onClick={() => router.back()}>
        <ArrowLeft size={14} /> Go Back
      </button>
    </div>
  );

  const statusColor: Record<string, string> = {
    ACTIVE: '#059669', WITHDRAWN: '#dc2626', CLOSED: '#64748b',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto' }}>
      {/* Back */}
      <div>
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={14} /> Back to Candidates
        </button>
      </div>

      {/* Header Card */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#1e3a5f',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <User size={26} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
              {candidate.first_name ? `${candidate.first_name} ${candidate.last_name || ''}`.trim() : candidate.name || 'Candidate'}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              {candidate.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={13} />{candidate.email}</span>}
              {candidate.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={13} />{candidate.phone}</span>}
              {candidate.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} />{candidate.location}</span>}
            </div>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: '#f0fdf4', color: statusColor[candidate.status] || '#64748b',
            border: `1px solid ${statusColor[candidate.status] || '#e2e8f0'}`,
            whiteSpace: 'nowrap',
          }}>
            {candidate.status || 'Active'}
          </span>
        </div>
      </div>

      {/* Targets / Applications */}
      {candidate.targets && candidate.targets.length > 0 && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>Applications</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {candidate.targets.map((t: any) => (
              <Link
                key={t.id}
                href={`/dashboard/vacancies/${t.vacancy_id}/readiness`}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-container-low)', textDecoration: 'none', color: 'inherit' }}
              >
                <Briefcase size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.vacancy_title || 'Vacancy'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Status: {t.target_status || '—'} · Applied {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Skills / Proof Summary */}
      {candidate.skill_summary && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>Skill Proof Summary</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(candidate.skill_summary).map(([key, val]: any) => (
              <span key={key} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                {key}: {val}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!candidate.targets?.length && !candidate.skill_summary && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <Award size={32} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No application data available for this candidate.</p>
        </div>
      )}
    </div>
  );
}
