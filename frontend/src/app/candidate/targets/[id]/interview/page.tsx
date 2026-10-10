'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  FileText,
  Accessibility,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
} from 'lucide-react';
import api from '@/lib/api';

export default function TargetInterviewPage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get(`/candidate-portal/targets/${targetId}/interview`)
      .then((res) => {
        if (!isMounted) return;
        setTarget(res.data?.target);
        setInterviews(res.data?.interviews || []);
      })
      .catch((err) => {
        console.error('Failed to load interviews:', err);
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
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Interview Workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 920, margin: '0 auto' }}>
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
              background: 'rgba(37, 99, 235, 0.2)',
              fontSize: 11,
              fontWeight: 700,
              color: '#93c5fd',
              textTransform: 'uppercase',
            }}
          >
            {target?.company_name} · Interview Stage
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
          Interview Workspace
        </h1>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>
          Interview schedules, meeting links, and preparation guidance for <strong>{target?.vacancy_title}</strong>.
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
          <strong>Candidate Privacy Boundary:</strong> Internal recruiter scorecards, private interview notes, and internal deliberations are retained strictly for the hiring committee. Candidates receive respectful, candidate-visible status updates.
        </div>
      </div>

      {/* Interview List / Status */}
      {interviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {interviews.map((int) => (
            <div key={int.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: '#dbeafe',
                      color: '#1e40af',
                      textTransform: 'uppercase',
                    }}
                  >
                    {int.interview_type || 'Technical Discussion'}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '6px 0 2px', color: 'var(--text-primary)' }}>
                    Interview Session
                  </h3>
                </div>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 99,
                    background: '#ecfdf5',
                    color: '#059669',
                  }}
                >
                  {int.status || 'SCHEDULED'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: '10px 14px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>DATE & TIME</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                    {new Date(int.scheduled_at).toLocaleDateString()} at {new Date(int.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>DURATION</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                    {int.duration_minutes || 45} Minutes
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: '#fafaf9', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>FORMAT</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                    {int.meeting_link ? 'Video Conference' : int.location || 'Online'}
                  </div>
                </div>
              </div>

              {int.instructions && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Preparation Guidance:
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                    {int.instructions}
                  </div>
                </div>
              )}

              {int.meeting_link && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <a
                    href={int.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Video size={15} />
                    <span>Join Meeting Room</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '36px 24px', textAlign: 'center' }}>
          <Calendar size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            No Interview Currently Scheduled
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 460, margin: '0 auto 20px' }}>
            When the hiring team completes review of your submitted evidence and invites you to an interview, schedule details and video links will appear here.
          </p>
          <Link
            href="/candidate/accessibility"
            style={{
              fontSize: 12.5,
              color: 'var(--primary)',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Accessibility size={14} />
            <span>Submit Interview Accommodation Request</span>
          </Link>
        </div>
      )}
    </div>
  );
}
