'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BookOpen,
  Layers,
  Clock,
  CheckCircle2,
  Bookmark,
  ExternalLink,
  ArrowLeft,
  Info,
  Sparkles,
  RefreshCw,
  Play,
  Check,
  FileText,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface LearningResource {
  id: string;
  requirementName: string;
  title: string;
  description: string;
  source: string;
  resourceType: string;
  language: string;
  estimatedDurationMins: number;
  url: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  isBookmarked: boolean;
  lastAccessedAt: string | null;
  completedAt: string | null;
}

interface RequirementCurriculum {
  id: string;
  name: string;
  description: string;
  importance: string;
  weight: number;
  resources: LearningResource[];
}

export default function TargetLearnPage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [requirements, setRequirements] = useState<RequirementCurriculum[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterBookmark, setFilterBookmark] = useState(false);

  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/candidate-portal/targets/${targetId}/learn`);
      setTarget(res.data?.target);
      setRequirements(res.data?.requirements || []);
      setSummary(res.data?.summary);
    } catch (err: any) {
      console.error('Failed to load learn module:', err);
      toast.error(err.response?.data?.error || 'Unable to load learning curriculum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) fetchCurriculum();
  }, [targetId]);

  const handleAction = async (resourceId: string, action: 'START' | 'COMPLETE' | 'RESET' | 'BOOKMARK') => {
    try {
      setUpdatingId(resourceId);
      const res = await api.post(`/candidate-portal/targets/${targetId}/learn/progress`, {
        resourceId,
        action,
      });

      const updatedProgress = res.data?.progress;

      // Update local state without full reload
      setRequirements((prev) =>
        prev.map((req) => ({
          ...req,
          resources: req.resources.map((r) => {
            if (r.id === resourceId) {
              return {
                ...r,
                status: updatedProgress.status,
                isBookmarked: updatedProgress.is_bookmarked,
                lastAccessedAt: updatedProgress.last_accessed_at,
                completedAt: updatedProgress.completed_at,
              };
            }
            return r;
          }),
        }))
      );

      // Re-evaluate summary counts
      setSummary((prev: any) => {
        if (!prev) return prev;
        let completed = 0;
        requirements.forEach((req) =>
          req.resources.forEach((r) => {
            const isComp = r.id === resourceId ? updatedProgress.status === 'COMPLETED' : r.status === 'COMPLETED';
            if (isComp) completed++;
          })
        );
        return {
          ...prev,
          completedResources: completed,
          summaryLabel: `${completed} of ${prev.totalResources} resources completed`,
          learningStatus: completed === prev.totalResources ? 'COMPLETED' : completed > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        };
      });

      if (action === 'COMPLETE') toast.success('Resource marked complete');
      if (action === 'RESET') toast.success('Resource progress reset');
      if (action === 'BOOKMARK') toast.success(updatedProgress.is_bookmarked ? 'Bookmarked' : 'Bookmark removed');
    } catch (err: any) {
      console.error('Update progress error:', err);
      toast.error('Failed to update progress');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Target-Linked Curriculum...</div>
        </div>
      </div>
    );
  }

  const allResourcesCount = summary?.totalResources || 0;
  const completedCount = summary?.completedResources || 0;
  const progressPct = allResourcesCount > 0 ? Math.round((completedCount / allResourcesCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
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
          <span>Back to Target Workspace Overview</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '26px 30px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#b45309',
                  textTransform: 'uppercase',
                }}
              >
                {target?.company_name} · Role Preparation
              </span>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#15803d',
                }}
              >
                Requirement-Mapped Curriculum
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px', color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              Target Learning Curriculum
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, maxWidth: 680 }}>
              Curated technical documentation, architectural guides, and engineering standards organized strictly by{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{target?.vacancy_title}</strong> requirements.
            </p>
          </div>

          {/* Progress Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              minWidth: 220,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Preparation Progress
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)' }}>{progressPct}%</span>
            </div>
            <div
              style={{
                height: 6,
                background: '#e2e8f0',
                borderRadius: 99,
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: progressPct === 100 ? '#10b981' : 'var(--primary)',
                  borderRadius: 99,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {completedCount} of {allResourcesCount} resources completed
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Policy Clarification Alert */}
      <div
        style={{
          padding: '16px 20px',
          background: '#eff6ff',
          borderRadius: 10,
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          fontSize: 12.5,
          color: '#1e40af',
          lineHeight: 1.5,
        }}
      >
        <Info size={20} style={{ flexShrink: 0, color: '#2563eb', marginTop: 1 }} />
        <div>
          <strong>Learning Completion Principle:</strong> Learning is preparation activity to help you master target competencies.
          Completing lessons builds readiness, but is <em>not</em> automatically converted into accepted evidence or skill proof.
          To verify competence, take the <strong>Official Assessment</strong> and submit artifacts in your <strong>Evidence Locker</strong>.
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          Curriculum Breakdown by Requirement ({requirements.length} Requirements)
        </div>
        <button
          type="button"
          onClick={() => setFilterBookmark(!filterBookmark)}
          className={`btn ${filterBookmark ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Bookmark size={13} />
          <span>{filterBookmark ? 'Showing Bookmarked' : 'Filter Bookmarked'}</span>
        </button>
      </div>

      {/* Requirement Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {requirements.map((req, reqIdx) => {
          const visibleResources = filterBookmark
            ? req.resources.filter((r) => r.isBookmarked)
            : req.resources;

          return (
            <div key={req.id} className="card" style={{ padding: '24px' }}>
              {/* Requirement Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                  paddingBottom: 14,
                  borderBottom: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Requirement #{reqIdx + 1}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '2px 0 4px', color: 'var(--text-primary)' }}>
                    {req.name}
                  </h3>
                  {req.description && (
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, maxWidth: 650 }}>
                      {req.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: '#f1f5f9',
                      color: '#475569',
                    }}
                  >
                    {req.importance || 'REQUIRED'}
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {req.resources.filter((r) => r.status === 'COMPLETED').length} / {req.resources.length} Done
                  </span>
                </div>
              </div>

              {/* Resource Items */}
              {visibleResources.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px dashed var(--border)',
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <FolderOpen size={24} style={{ margin: '0 auto 6px', color: '#94a3b8' }} />
                  {filterBookmark ? 'No bookmarked resources in this section.' : 'No preparation resources curated yet for this requirement.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {visibleResources.map((res) => {
                    const isUpdating = updatingId === res.id;
                    const isDone = res.status === 'COMPLETED';

                    return (
                      <div
                        key={res.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          borderRadius: 10,
                          background: isDone ? '#f0fdf4' : '#fafaf9',
                          border: isDone ? '1px solid #bbf7d0' : '1px solid var(--border)',
                          flexWrap: 'wrap',
                          gap: 14,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 280 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: 4,
                                background: isDone ? '#dcfce7' : '#e2e8f0',
                                color: isDone ? '#166534' : '#475569',
                                textTransform: 'uppercase',
                              }}
                            >
                              {res.resourceType}
                            </span>
                            <span style={{ fontSize: 11.5, color: '#64748b' }}>{res.source}</span>
                            {res.isBookmarked && (
                              <span style={{ fontSize: 11, color: '#eab308', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Bookmark size={11} fill="#eab308" /> Bookmarked
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                            {res.title}
                          </div>

                          {res.description && (
                            <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.4, marginBottom: 6 }}>
                              {res.description}
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: '#94a3b8' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} /> ~{res.estimatedDurationMins} mins
                            </span>
                            <span>·</span>
                            <span>Language: {res.language}</span>
                            {res.completedAt && (
                              <>
                                <span>·</span>
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                  Completed {new Date(res.completedAt).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {res.url && (
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => {
                                if (res.status === 'NOT_STARTED') {
                                  handleAction(res.id, 'START');
                                }
                              }}
                              className="btn btn-secondary"
                              style={{
                                fontSize: 12,
                                padding: '6px 12px',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span>Open</span>
                              <ExternalLink size={12} />
                            </a>
                          )}

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleAction(res.id, isDone ? 'RESET' : 'COMPLETE')}
                            className={`btn ${isDone ? 'btn-secondary' : 'btn-primary'}`}
                            style={{
                              fontSize: 12,
                              padding: '6px 14px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {isDone ? (
                              <>
                                <Check size={13} style={{ color: '#16a34a' }} />
                                <span>Completed</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Mark Complete</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleAction(res.id, 'BOOKMARK')}
                            className="btn btn-secondary"
                            style={{ padding: '6px 9px', color: res.isBookmarked ? '#eab308' : '#64748b' }}
                            title={res.isBookmarked ? 'Remove Bookmark' : 'Bookmark Resource'}
                          >
                            <Bookmark size={14} fill={res.isBookmarked ? '#eab308' : 'none'} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Link
          href={`/candidate/targets/${targetId}`}
          className="btn btn-secondary"
          style={{ textDecoration: 'none', fontSize: 13 }}
        >
          ← Target Overview
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href={`/candidate/targets/${targetId}/practice`}
            className="btn btn-primary"
            style={{ textDecoration: 'none', fontSize: 13 }}
          >
            Proceed to Practice Sandbox →
          </Link>
        </div>
      </div>
    </div>
  );
}
