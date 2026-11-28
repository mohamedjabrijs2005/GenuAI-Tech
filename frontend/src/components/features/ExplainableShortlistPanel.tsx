'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ArrowUpDown,
  RefreshCw,
  MessageSquare,
  Send,
  Columns,
  X,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface SkillProofItem {
  requirementId?: string;
  skill: string;
  proofLevel: 'verified' | 'assessed' | 'claimed' | 'not_assessed' | string;
  status: 'meets' | 'partial' | 'missing' | 'trainable' | string;
  score?: number | null;
  trainable?: boolean;
  reason: string;
  interviewFocus?: string | null;
  type?: string;
}

interface ShortlistCandidate {
  targetId: string;
  candidateId: string;
  displayName: string;
  candidateEmail?: string | null;
  interviewStage?: string;
  assessmentInvitedAt?: string | null;
  overallFit: 'strong' | 'promising' | 'partial' | 'not_ready' | string;
  systemFit: string;
  override?: {
    overrideRank?: number | null;
    overrideFit?: string | null;
    reason?: string;
  } | null;
  hiringOutcome?: {
    decision: 'rejected' | 'offered' | 'joined' | 'on_hold' | string;
    reason_code?: string | null;
    notes?: string | null;
  } | null;
  skills: SkillProofItem[];
  missingSkills: string[];
  trainableGaps: string[];
  interviewFocus: string[];
}

const FIT_BADGE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  strong: { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4', label: 'Strong Fit' },
  promising: { bg: '#fffbeb', color: '#854d0e', border: '#fde68a', label: 'Promising Fit' },
  partial: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', label: 'Partial Fit' },
  not_ready: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Not Ready' },
};

const PROOF_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  verified: { bg: '#ccfbf1', color: '#115e59', label: 'Verified' },
  assessed: { bg: '#dbeafe', color: '#1e40af', label: 'Assessed' },
  claimed: { bg: '#fef3c7', color: '#854d0e', label: 'Claimed' },
  not_assessed: { bg: '#f1f5f9', color: '#475569', label: 'Not Assessed' },
};

const INTERVIEW_STAGES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'screening', label: 'Screening' },
  { value: 'technical_round', label: 'Technical Round' },
  { value: 'final_round', label: 'Final Round' },
  { value: 'offer_stage', label: 'Offer Stage' },
  { value: 'completed', label: 'Completed' },
];

export function ExplainableShortlistPanel({ vacancyId }: { vacancyId: string }) {
  const [data, setData] = useState<{ checklistStatus: string; candidates: ShortlistCandidate[]; totalCount?: number; note?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overrideTarget, setOverrideTarget] = useState<string | null>(null);
  const [overrideRank, setOverrideRank] = useState('1');
  const [overrideFit, setOverrideFit] = useState('strong');
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters
  const [proofLevel, setProofLevel] = useState('');
  const [assessmentStatus, setAssessmentStatus] = useState('');
  const [missingSkill, setMissingSkill] = useState('');
  const [trainableOnly, setTrainableOnly] = useState(false);

  // Comparison
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const loadShortlist = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (proofLevel) params.set('proofLevel', proofLevel);
      if (assessmentStatus) params.set('assessmentStatus', assessmentStatus);
      if (missingSkill.trim()) params.set('missingSkill', missingSkill.trim());
      if (trainableOnly) params.set('trainableOnly', 'true');
      const qs = params.toString();
      const res = await api.get(`/company/vacancies/${vacancyId}/shortlist${qs ? `?${qs}` : ''}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load explainable shortlist.');
    } finally {
      setLoading(false);
    }
  }, [vacancyId, proofLevel, assessmentStatus, missingSkill, trainableOnly]);

  useEffect(() => {
    if (vacancyId) loadShortlist();
  }, [vacancyId, loadShortlist]);

  const handleSaveOverride = async (targetId: string) => {
    if (!overrideReason.trim()) {
      toast.error('Please enter a reason for overriding rank.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/company/vacancies/${vacancyId}/candidates/${targetId}/shortlist-override`, {
        overrideRank: overrideRank ? Number(overrideRank) : null,
        overrideFit: overrideFit || null,
        reason: overrideReason.trim(),
      });
      toast.success('HR shortlist override saved');
      setOverrideTarget(null);
      setOverrideReason('');
      await loadShortlist();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save override');
    } finally {
      setSaving(false);
    }
  };

  const handleOutcome = async (targetId: string, decision: string) => {
    if (!decision) return;
    setSaving(true);
    try {
      await api.post(`/company/vacancies/${vacancyId}/candidates/${targetId}/hiring-outcome`, {
        decision,
        notes: `Recorded via Explainable Shortlist (${decision})`,
      });
      toast.success(`Hiring outcome recorded: ${decision.replace('_', ' ')}`);
      await loadShortlist();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to record hiring outcome');
    } finally {
      setSaving(false);
    }
  };

  const handleInterviewStage = async (targetId: string, stage: string) => {
    setSaving(true);
    try {
      await api.patch(`/company/vacancies/${vacancyId}/candidates/${targetId}/interview-stage`, { stage });
      toast.success(`Interview stage updated to ${stage.replace('_', ' ')}`);
      await loadShortlist();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update interview stage');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteAssessment = async (cand: ShortlistCandidate) => {
    const email = cand.candidateEmail || window.prompt(`Enter email for ${cand.displayName} to send assessment invite:`);
    if (!email || !email.trim()) return;
    setSaving(true);
    try {
      await api.post('/assessments/company/invite', {
        candidateEmail: email.trim(),
        vacancyId,
        targetId: cand.targetId,
      });
      toast.success(`Assessment invitation sent to ${cand.displayName}`);
      await loadShortlist();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send assessment invite');
    } finally {
      setSaving(false);
    }
  };

  const toggleCompare = (targetId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(targetId)) return prev.filter((id) => id !== targetId);
      if (prev.length >= 2) return [prev[1], targetId];
      return [...prev, targetId];
    });
  };

  const comparedCandidates = (data?.candidates || []).filter((c) => compareIds.includes(c.targetId));

  return (
    <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} style={{ color: '#0f766e' }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              Explainable Shortlist ({data?.candidates?.length ?? 0}{data?.totalCount !== undefined && data.totalCount !== data.candidates?.length ? ` / ${data.totalCount}` : ''})
            </h2>
            {data?.checklistStatus && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#fffbeb', color: '#854d0e', border: '1px solid #fde68a' }}>
                Checklist: {data.checklistStatus}
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Candidates ranked by verified, assessed, and confirmed skill proof against this vacancy&apos;s checklist.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {compareIds.length === 2 && (
            <button type="button" onClick={() => setShowCompare(true)} className="btn btn-gold btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Columns size={13} /> Compare Selected (2)
            </button>
          )}
          <button type="button" onClick={loadShortlist} disabled={loading} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Shortlist
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)', marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Filter size={13} /> Filters:
        </span>
        <select value={proofLevel} onChange={(e) => setProofLevel(e.target.value)} className="form-select" style={{ height: 32, fontSize: 12, width: 155 }}>
          <option value="">All Proof Levels</option>
          <option value="verified">Has Verified Skill</option>
          <option value="assessed">Has Assessed Skill</option>
          <option value="claimed">Has Claimed Skill</option>
          <option value="not_assessed">Has Not Assessed</option>
        </select>
        <select value={assessmentStatus} onChange={(e) => setAssessmentStatus(e.target.value)} className="form-select" style={{ height: 32, fontSize: 12, width: 170 }}>
          <option value="">All Assessment States</option>
          <option value="invited">Invited to Assessment</option>
          <option value="not_invited">Not Invited Yet</option>
          <option value="assessed">Assessed / Verified</option>
        </select>
        <input
          type="text"
          value={missingSkill}
          onChange={(e) => setMissingSkill(e.target.value)}
          placeholder="Filter by missing skill..."
          className="form-input"
          style={{ height: 32, fontSize: 12, width: 180 }}
        />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={trainableOnly} onChange={(e) => setTrainableOnly(e.target.checked)} />
          Only trainable gaps
        </label>
        {(proofLevel || assessmentStatus || missingSkill || trainableOnly) && (
          <button
            type="button"
            onClick={() => { setProofLevel(''); setAssessmentStatus(''); setMissingSkill(''); setTrainableOnly(false); }}
            className="btn btn-secondary btn-xs"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
          Computing per-skill proof matrix...
        </div>
      ) : error ? (
        <div style={{ padding: 14, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>{error}</div>
      ) : !data || data.candidates.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', background: '#f8fafc', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
          No matching candidate targets found. Adjust filters or wait for candidates to apply and confirm skills.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.candidates.map((cand, index) => {
            const fit = FIT_BADGE[cand.overallFit] || FIT_BADGE.not_ready;
            const isOverriding = overrideTarget === cand.targetId;
            const isCompared = compareIds.includes(cand.targetId);
            return (
              <div key={cand.targetId} style={{ border: isCompared ? '1.5px solid #b45309' : '1px solid var(--border)', borderRadius: 12, padding: 18, background: '#fcfcfd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#fef3c7', color: '#854d0e' }}>
                      #{index + 1}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{cand.displayName}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: fit.bg, color: fit.color, border: `1px solid ${fit.border}` }}>
                      {fit.label}
                    </span>
                    {cand.assessmentInvitedAt && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={11} /> Assessment Invited
                      </span>
                    )}
                    {cand.override && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#fffbeb', color: '#854d0e', border: '1px solid #fde68a' }}>
                        HR Override (Rank #{cand.override.overrideRank ?? '—'} · System: {cand.systemFit})
                      </span>
                    )}
                    {cand.hiringOutcome && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4', textTransform: 'uppercase' }}>
                        Outcome: {cand.hiringOutcome.decision.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => toggleCompare(cand.targetId)}
                      className="btn btn-secondary btn-xs"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderColor: isCompared ? '#b45309' : undefined }}
                    >
                      <Columns size={12} /> {isCompared ? 'Selected' : 'Compare'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInviteAssessment(cand)}
                      disabled={saving}
                      className="btn btn-secondary btn-xs"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Send size={12} /> {cand.assessmentInvitedAt ? 'Re-invite' : 'Invite Assessment'}
                    </button>
                    <select
                      value={cand.interviewStage || 'not_started'}
                      disabled={saving}
                      onChange={(e) => handleInterviewStage(cand.targetId, e.target.value)}
                      className="form-select"
                      style={{ height: 30, fontSize: 12, width: 145, padding: '2px 8px' }}
                      aria-label="Interview stage"
                    >
                      {INTERVIEW_STAGES.map((st) => (
                        <option key={st.value} value={st.value}>Stage: {st.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setOverrideTarget(isOverriding ? null : cand.targetId)}
                      className="btn btn-secondary btn-xs"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <ArrowUpDown size={12} /> Override Rank
                    </button>
                    <select
                      value={cand.hiringOutcome?.decision || ''}
                      disabled={saving}
                      onChange={(e) => handleOutcome(cand.targetId, e.target.value)}
                      className="form-select"
                      style={{ height: 30, fontSize: 12, width: 150, padding: '2px 8px' }}
                    >
                      <option value="">Hiring Outcome…</option>
                      <option value="offered">Offered</option>
                      <option value="joined">Joined</option>
                      <option value="on_hold">On Hold</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {isOverriding && (
                  <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="number"
                      min={1}
                      value={overrideRank}
                      onChange={(e) => setOverrideRank(e.target.value)}
                      placeholder="Rank"
                      className="form-input"
                      style={{ width: 70, height: 34 }}
                    />
                    <select
                      value={overrideFit}
                      onChange={(e) => setOverrideFit(e.target.value)}
                      className="form-select"
                      style={{ width: 130, height: 34 }}
                    >
                      <option value="strong">Strong Fit</option>
                      <option value="promising">Promising Fit</option>
                      <option value="partial">Partial Fit</option>
                      <option value="not_ready">Not Ready</option>
                    </select>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Required HR justification for audit log..."
                      className="form-input"
                      style={{ flex: 1, minWidth: 220, height: 34 }}
                    />
                    <button type="button" onClick={() => handleSaveOverride(cand.targetId)} disabled={saving} className="btn btn-gold btn-sm">
                      Save Override
                    </button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                  {cand.skills.map((sk, idx) => {
                    const pb = PROOF_BADGE[sk.proofLevel] || PROOF_BADGE.not_assessed;
                    return (
                      <div key={sk.requirementId || `${sk.skill}-${idx}`} style={{ padding: '10px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{sk.skill}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: pb.bg, color: pb.color }}>
                            {pb.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{sk.reason}</div>
                      </div>
                    );
                  })}
                </div>

                {(cand.trainableGaps.length > 0 || cand.interviewFocus.length > 0 || cand.missingSkills.length > 0) && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {cand.trainableGaps.length > 0 && (
                      <div>
                        <strong style={{ color: '#854d0e' }}>Trainable Gaps:</strong> {cand.trainableGaps.join(', ')}
                      </div>
                    )}
                    {cand.missingSkills.length > 0 && (
                      <div>
                        <strong style={{ color: '#991b1b' }}>Missing Skills:</strong> {cand.missingSkills.join(', ')}
                      </div>
                    )}
                    {cand.interviewFocus.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MessageSquare size={12} style={{ color: '#0f766e' }} />
                        <span><strong>Interview Focus:</strong> {cand.interviewFocus[0]}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showCompare && comparedCandidates.length === 2 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, maxWidth: 860, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Side-by-Side Candidate Comparison</h3>
              <button type="button" onClick={() => setShowCompare(false)} className="btn btn-secondary btn-xs">
                <X size={14} />
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px' }}>Skill / Metric</th>
                  <th style={{ padding: '10px 8px' }}>{comparedCandidates[0].displayName}</th>
                  <th style={{ padding: '10px 8px' }}>{comparedCandidates[1].displayName}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>Overall Fit</td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{comparedCandidates[0].overallFit.replace('_', ' ')}</td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{comparedCandidates[1].overallFit.replace('_', ' ')}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>Interview Stage</td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{(comparedCandidates[0].interviewStage || 'not_started').replace('_', ' ')}</td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{(comparedCandidates[1].interviewStage || 'not_started').replace('_', ' ')}</td>
                </tr>
                {comparedCandidates[0].skills.map((sk, idx) => {
                  const other = comparedCandidates[1].skills.find((s) => s.skill === sk.skill) || comparedCandidates[1].skills[idx];
                  return (
                    <tr key={sk.requirementId || sk.skill} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{sk.skill}</td>
                      <td style={{ padding: '10px 8px' }}>{sk.proofLevel} ({sk.status})</td>
                      <td style={{ padding: '10px 8px' }}>{other ? `${other.proofLevel} (${other.status})` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
