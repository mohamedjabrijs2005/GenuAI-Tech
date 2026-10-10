'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Shield,
  FileCheck,
  Target,
  User,
  Calendar,
  Layers,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';

export default function CandidateActivityPage() {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get('/candidate-portal/activity')
      .then((res) => {
        if (!isMounted) return;
        setActivity(res.data?.activity || []);
      })
      .catch((err) => {
        console.error('Failed to load activity log:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getActivityIcon = (action: string) => {
    if (action.includes('TARGET')) return <Target size={16} style={{ color: '#854d0e' }} />;
    if (action.includes('EVIDENCE')) return <FileCheck size={16} style={{ color: '#059669' }} />;
    if (action.includes('INTERVIEW')) return <Calendar size={16} style={{ color: '#2563eb' }} />;
    return <User size={16} style={{ color: 'var(--primary)' }} />;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Activity Trail...</div>
        </div>
      </div>
    );
  }

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
              background: 'rgba(212, 175, 55, 0.2)',
              fontSize: 11,
              fontWeight: 700,
              color: '#fef08a',
              textTransform: 'uppercase',
            }}
          >
            Candidate-Visible Events Only
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
          Candidate Activity Trail
        </h1>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>
          A chronological, transparent log of all candidate-side actions and recruiter review milestones.
        </p>
      </div>

      {/* Activity List */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Audit Trail Records ({activity.length})
        </h2>

        {activity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activity.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 8,
                  background: '#fafaf9',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {getActivityIcon(act.action)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {act.reason || act.action.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {act.company_name ? `Hiring Company: ${act.company_name} · ` : ''}
                    Status: <span style={{ fontWeight: 600, color: '#1e293b' }}>{act.new_status || 'RECORDED'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
            No activity records recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
