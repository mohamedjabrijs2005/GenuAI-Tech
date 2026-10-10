'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Target,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Compass,
  Building2,
  MapPin,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import api from '@/lib/api';

export default function CandidateTargetsPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Withdrawal modal state
  const [withdrawingTarget, setWithdrawingTarget] = useState<any>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const fetchTargets = () => {
    setLoading(true);
    api
      .get('/candidate-portal/targets')
      .then((res) => {
        setTargets(res.data?.targets || []);
      })
      .catch((err) => {
        console.error('Failed to load targets:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleWithdrawConfirm = async () => {
    if (!withdrawingTarget) return;
    setWithdrawing(true);
    setWithdrawError('');

    try {
      await api.post(`/candidate-portal/targets/${withdrawingTarget.target_id}/withdraw`, {
        reason: withdrawReason || 'Candidate voluntary withdrawal',
      });
      setWithdrawingTarget(null);
      setWithdrawReason('');
      fetchTargets();
    } catch (err: any) {
      setWithdrawError(err.response?.data?.error || 'Failed to withdraw target.');
    } finally {
      setWithdrawing(false);
    }
  };

  const filteredTargets = targets.filter((t) => {
    const matchesSearch =
      t.vacancy_title.toLowerCase().includes(search.toLowerCase()) ||
      t.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.target_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                  background: 'rgba(212, 175, 55, 0.2)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fef08a',
                  textTransform: 'uppercase',
                }}
              >
                Multi-Target Management
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
              My Career Targets
            </h1>
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 650 }}>
              Each Target represents a distinct vacancy with isolated requirements, learning roadmaps, submitted evidence, and recruiter review workflows.
            </p>
          </div>

          <Link
            href="/candidate/vacancies"
            className="btn btn-primary"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Compass size={15} />
            <span>Target New Vacancy</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search targets by role or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>

        <select
          className="input-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 180, cursor: 'pointer' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="TARGETED">TARGETED</option>
          <option value="PREPARING">PREPARING</option>
          <option value="EVIDENCE_SUBMITTED">EVIDENCE_SUBMITTED</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="INTERVIEW">INTERVIEW</option>
          <option value="WITHDRAWN">WITHDRAWN</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Target Cards / List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 13, color: '#64748b' }}>Loading your active targets...</div>
        </div>
      ) : filteredTargets.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredTargets.map((t) => {
            const isWithdrawn = t.target_status === 'WITHDRAWN';
            const isClosed = t.target_status === 'CLOSED' || t.target_status === 'DECIDED';
            const supported = t.supported_count || 0;
            const total = t.total_requirements || t.requirements_count || 0;

            return (
              <div
                key={t.target_id}
                className="card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  opacity: isWithdrawn ? 0.65 : 1,
                  border: isWithdrawn ? '1px dashed #cbd5e1' : '1px solid var(--border)',
                }}
              >
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background:
                          t.target_status === 'UNDER_REVIEW'
                            ? '#fef3c7'
                            : isWithdrawn
                            ? '#f1f5f9'
                            : t.target_status === 'INTERVIEW'
                            ? '#dbeafe'
                            : 'rgba(212, 175, 55, 0.15)',
                        color:
                          t.target_status === 'UNDER_REVIEW'
                            ? '#92400e'
                            : isWithdrawn
                            ? '#64748b'
                            : t.target_status === 'INTERVIEW'
                            ? '#1d4ed8'
                            : '#854d0e',
                      }}
                    >
                      {t.target_status}
                    </span>
                    {t.version_number && (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>v{t.version_number}</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                    {t.vacancy_title}
                  </h3>

                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>
                    {t.company_name}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={13} />
                      {t.department_name || 'Engineering'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} />
                      {t.location || 'Remote'} ({t.work_mode || 'Flexible'})
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Layers size={13} />
                      {total} Requirements
                    </span>
                  </div>
                </div>

                {/* Coverage Summary */}
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                    EVIDENCE COVERAGE
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {supported} of {total} Supported
                  </div>
                  <div
                    style={{
                      width: 140,
                      height: 5,
                      background: '#e2e8f0',
                      borderRadius: 99,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${total > 0 ? (supported / total) * 100 : 0}%`,
                        height: '100%',
                        background: '#10b981',
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!isWithdrawn && !isClosed && (
                    <button
                      onClick={() => setWithdrawingTarget(t)}
                      className="btn btn-secondary"
                      style={{ fontSize: 12, color: '#ef4444' }}
                      title="Withdraw target"
                    >
                      Withdraw
                    </button>
                  )}
                  <Link
                    href={`/candidate/targets/${t.target_id}`}
                    className="btn btn-primary"
                    style={{ fontSize: 12.5, padding: '7px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Open Workspace</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fafaf9', borderRadius: 12 }}>
          <Target size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
            No Targets Found
          </div>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 420, margin: '0 auto 16px' }}>
            You have not targeted any published vacancies yet, or no targets match your filter.
          </p>
          <Link href="/candidate/vacancies" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Explore Verified Vacancies
          </Link>
        </div>
      )}

      {/* Target Withdrawal Confirmation Modal */}
      {withdrawingTarget && (
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
              maxWidth: 480,
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', marginBottom: 12 }}>
              <AlertCircle size={22} />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Confirm Target Withdrawal</h3>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 14 }}>
              Are you sure you want to withdraw your target for <strong>{withdrawingTarget.vacancy_title}</strong> at{' '}
              <strong>{withdrawingTarget.company_name}</strong>? Your submitted evidence history will be retained in your activity archive, but recruitment consideration will be closed.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b' }}>
                Optional Withdrawal Reason (Private)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Accepted another opportunity, re-evaluating target..."
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
              />
            </div>

            {withdrawError && (
              <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12, fontWeight: 600 }}>
                {withdrawError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setWithdrawingTarget(null)}
                className="btn btn-secondary"
                disabled={withdrawing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdrawConfirm}
                className="btn"
                style={{ background: '#ef4444', color: '#fff', fontWeight: 700 }}
                disabled={withdrawing}
              >
                {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
