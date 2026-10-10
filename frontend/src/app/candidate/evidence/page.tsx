'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Target,
  ArrowRight,
  Shield,
  Layers,
  Compass,
  AlertCircle,
  Building2,
} from 'lucide-react';
import api from '@/lib/api';

export default function CandidateEvidenceIndexPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get('/candidate-portal/targets')
      .then((res) => {
        if (!isMounted) return;
        setTargets(res.data?.targets || []);
      })
      .catch((err) => {
        console.error('Failed to load targets:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Evidence Lockers...</div>
        </div>
      </div>
    );
  }

  const activeTargets = targets.filter((t) => !['WITHDRAWN', 'CLOSED'].includes(t.target_status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
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
            Target-Specific Evidence Lockers
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
          Evidence Lockers
        </h1>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 650 }}>
          Evidence in GenuAI is never a generic document dump. Every work sample, repository, and credential is bound to a specific vacancy requirement inside that role's Target Workspace.
        </p>
      </div>

      {/* Target Lockers List */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Select Target Workspace to Open Evidence Locker
        </h2>

        {activeTargets.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeTargets.map((t) => (
              <div
                key={t.target_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 10,
                  background: '#fafaf9',
                  border: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: 'rgba(212, 175, 55, 0.15)',
                        color: '#854d0e',
                      }}
                    >
                      {t.target_status}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                      {t.company_name}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                    {t.vacancy_title}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {t.supported_count || 0} of {t.total_requirements || t.requirements_count || 0} Requirements Supported
                  </div>
                </div>

                <Link
                  href={`/candidate/targets/${t.target_id}/evidence`}
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
                >
                  <FileCheck size={14} />
                  <span>Open Evidence Locker</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 20px', background: '#fafaf9', borderRadius: 8 }}>
            <Target size={32} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
              No Active Targets
            </div>
            <p style={{ fontSize: 12.5, color: '#64748b', maxWidth: 440, margin: '0 auto 16px' }}>
              Create a target for an approved vacancy to unlock its dedicated evidence locker and requirement mapping.
            </p>
            <Link href="/candidate/vacancies" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Explore Published Vacancies
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
