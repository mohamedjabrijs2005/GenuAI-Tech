'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  FileCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Target,
  Shield,
  Calendar,
  AlertCircle,
  ArrowRight,
  BookOpen,
  User,
  Info,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
  candidate: any;
  profileCompletion: {
    percentage: number;
    completedCount: number;
    totalCount: number;
    items: Array<{ key: string; label: string; completed: boolean }>;
    missingItems: string[];
  };
  activeTargetsCount: number;
  publishedVacanciesCount: number;
  evidenceAwaitingActionCount: number;
  upcomingSchedule: any;
  actionRequired: Array<{
    id: string;
    title: string;
    description: string;
    link: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  targets: any[];
  recentActivity: any[];
}

export default function CandidateDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    api
      .get('/candidate-portal/dashboard')
      .then((res) => {
        if (!isMounted) return;
        setData(res.data);
      })
      .catch((err) => {
        console.error('Failed to load candidate dashboard metrics:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const candidateFirstName = user?.firstName || data?.candidate?.first_name || 'Candidate';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading your recruitment workspace…</div>
        </div>
      </div>
    );
  }

  const completionPct = data?.profileCompletion?.percentage || 0;
  const activeTargets = (data?.targets || []).filter((t: any) => !['WITHDRAWN', 'CLOSED'].includes(t.target_status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative blur */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 10px', borderRadius: 99,
                background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)',
                fontSize: 10.5, fontWeight: 700, color: '#fef08a', letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}>
                <Shield size={11} style={{ color: '#d4af37' }} />
                Private Career Workspace
              </span>
              <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Connected · {lastSyncTime}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              {getGreeting()}, {candidateFirstName}
            </h1>
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
              Your private recruitment workspace — understand role requirements, submit requirement-linked evidence, and track human recruiter review.
            </p>
          </div>

          {/* Profile Completion Card */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '16px 20px',
            minWidth: 220,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#e2e8f0' }}>Profile Completion</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fef08a' }}>{completionPct}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                height: '100%', width: `${completionPct}%`,
                background: 'linear-gradient(90deg, #d4af37, #fde047)',
                borderRadius: 99, transition: 'width 0.5s ease',
              }} />
            </div>
            <Link href="/candidate/profile" style={{
              fontSize: 11.5, color: '#93c5fd', textDecoration: 'none',
              fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <span>{completionPct === 100 ? 'View your profile' : 'Complete your profile'}</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>

        {/* Active Targets */}
        <Link href="/candidate/targets" style={{ textDecoration: 'none', color: 'inherit' }} className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Active Targets
            </span>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--brand-subtle)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Target size={17} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1 }}>
            {data?.activeTargetsCount || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Independent vacancy workspaces</span>
            <ArrowRight size={12} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />
          </div>
        </Link>

        {/* Published Vacancies */}
        <Link href="/candidate/vacancies" style={{ textDecoration: 'none', color: 'inherit' }} className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Open Vacancies
            </span>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'rgba(5,150,105,0.1)', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Compass size={17} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1 }}>
            {data?.publishedVacanciesCount || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>From approved verified employers</span>
            <ArrowRight size={12} style={{ marginLeft: 'auto', color: '#059669' }} />
          </div>
        </Link>

        {/* Evidence Awaiting Action */}
        <Link
          href={activeTargets.length > 0 ? `/candidate/targets/${activeTargets[0].target_id}/evidence` : '/candidate/targets'}
          style={{ textDecoration: 'none', color: 'inherit' }}
          className="dashboard-card"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Evidence Pending
            </span>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'rgba(234,88,12,0.08)', color: '#ea580c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileCheck size={17} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1 }}>
            {data?.evidenceAwaitingActionCount || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Drafts or more info requested</span>
            <ArrowRight size={12} style={{ marginLeft: 'auto', color: '#ea580c' }} />
          </div>
        </Link>

        {/* Upcoming Schedule */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Upcoming Schedule
            </span>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar size={17} />
            </div>
          </div>
          {data?.upcomingSchedule ? (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {data.upcomingSchedule.vacancy_title}
              </div>
              <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} />
                <span>
                  {new Date(data.upcomingSchedule.scheduled_at).toLocaleDateString()} at{' '}
                  {new Date(data.upcomingSchedule.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
                No upcoming events
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Interviews will appear here when scheduled
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Action Required ── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <AlertCircle size={17} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Action Required
          </h2>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: 'var(--warning-bg)', color: '#92400e', border: '1px solid var(--warning-border)',
          }}>
            {data?.actionRequired?.length || 0} item{(data?.actionRequired?.length || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {data?.actionRequired && data.actionRequired.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.actionRequired.map((act) => (
              <div key={act.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 10, flexWrap: 'wrap', gap: 12,
                background: act.priority === 'HIGH' ? 'var(--warning-bg)' : 'var(--surface-container-low)',
                border: act.priority === 'HIGH' ? '1px solid var(--warning-border)' : '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {act.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{act.description}</div>
                </div>
                <Link
                  href={act.link}
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '6px 14px', textDecoration: 'none', flexShrink: 0 }}
                >
                  Take Action
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '14px 16px', background: 'var(--success-bg)', borderRadius: 8,
            border: '1px solid var(--success-border)', fontSize: 13, color: '#166534',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle2 size={16} />
            <span>All requirements and profile items are up to date. Explore new vacancies or review submitted evidence.</span>
          </div>
        )}
      </div>

      {/* ── My Targets Table ── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 3px', color: 'var(--text-primary)' }}>
              My Targets
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Each target has its own isolated requirements, evidence, coverage, and company visibility boundary.
            </div>
          </div>
          <Link
            href="/candidate/vacancies"
            className="btn btn-primary"
            style={{ fontSize: 12.5, padding: '7px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Compass size={14} />
            <span>Target New Vacancy</span>
          </Link>
        </div>

        {data?.targets && data.targets.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Vacancy & Company</th>
                  <th>Status</th>
                  <th>Coverage</th>
                  <th>Targeted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.targets.map((t: any) => {
                  const isWithdrawn = t.target_status === 'WITHDRAWN';
                  const supported = t.supported_count || 0;
                  const total = t.total_requirements || t.requirements_count || 0;
                  const pct = total > 0 ? Math.round((supported / total) * 100) : 0;

                  const statusColor = t.target_status === 'UNDER_REVIEW'
                    ? { bg: 'var(--warning-bg)', color: '#92400e', border: 'var(--warning-border)' }
                    : t.target_status === 'WITHDRAWN'
                    ? { bg: 'var(--surface-container-low)', color: 'var(--text-muted)', border: 'var(--border)' }
                    : t.target_status === 'INTERVIEW'
                    ? { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' }
                    : { bg: 'var(--brand-subtle)', color: 'var(--primary)', border: 'rgba(212,175,55,0.3)' };

                  return (
                    <tr key={t.target_id} style={{ opacity: isWithdrawn ? 0.6 : 1 }}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
                          {t.vacancy_title}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {t.company_name} · {t.department_name || 'Engineering'} · {t.work_mode || 'Remote'}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                          background: statusColor.bg, color: statusColor.color,
                          border: `1px solid ${statusColor.border}`,
                          display: 'inline-block',
                        }}>
                          {t.target_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                          {supported}/{total} req.
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', maxWidth: 80 }}>
                            <div style={{
                              width: `${pct}%`, height: '100%',
                              background: pct === 100 ? '#10b981' : 'var(--primary)',
                              borderRadius: 99,
                            }} />
                          </div>
                          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(t.targeted_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/candidate/targets/${t.target_id}`}
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: '5px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          Open <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--surface-container-low)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <Compass size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              No Active Targets Yet
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 16px', lineHeight: 1.6 }}>
              Explore verified published vacancies and create your first target. Each target lets you prepare evidence and track recruiter progress.
            </p>
            <Link href="/candidate/vacancies" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Explore Published Vacancies
            </Link>
          </div>
        )}
      </div>

      {/* ── Recent Activity ── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Recent Activity
          </h2>
          <Link href="/candidate/activity" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {data?.recentActivity && data.recentActivity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.recentActivity.map((act: any) => (
              <div key={act.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                background: 'var(--surface-container-low)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--primary)', marginTop: 5, flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {act.reason || act.action.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {act.company_name ? `${act.company_name} · ` : ''}
                    {new Date(act.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
            No recent activity recorded yet.
          </div>
        )}
      </div>

      {/* ── Transparency Callout ── */}
      <div style={{
        padding: '14px 18px', background: 'var(--surface-container-low)',
        borderRadius: 10, border: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
        fontSize: 12, color: 'var(--text-secondary)',
      }}>
        <Info size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>GenuAI Evaluation Guarantee:</strong>{' '}
          We do not produce opaque AI suitability scores, candidate rankings, or automated decisions. Hiring evaluation is conducted by human recruiters reviewing requirement-linked evidence against published role rubrics.
        </span>
      </div>

    </div>
  );
}
