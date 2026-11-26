'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface SkillClaim {
  id: string;
  skill_name: string;
  claim_text?: string;
  source: string;
  confirmed_by_candidate: boolean;
}

interface TargetSkillProof {
  requirementId: string;
  skillName: string;
  proofLevel: string;
  status: string;
  reason: string;
}

const LEVEL_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  verified: { bg: '#ccfbf1', color: '#115e59', label: 'Verified' },
  assessed: { bg: '#dbeafe', color: '#1e40af', label: 'Assessed' },
  claimed: { bg: '#fef3c7', color: '#854d0e', label: 'Claimed' },
  not_assessed: { bg: '#f1f5f9', color: '#475569', label: 'Not Assessed' },
};

export function CandidateSkillClaimsPanel({ targetId, suggestedSkills = [] }: { targetId: string; suggestedSkills?: string[] }) {
  const [claims, setClaims] = useState<SkillClaim[]>([]);
  const [proofSkills, setProofSkills] = useState<TargetSkillProof[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [claimsRes, proofRes] = await Promise.all([
        api.get('/candidate/skill-claims'),
        api.get(`/candidate/skill-claims/targets/${targetId}/proof`),
      ]);
      setClaims(claimsRes.data?.claims || []);
      setProofSkills(proofRes.data?.skills || []);
    } catch (_) {
      // Quietly fallback if target not synced yet
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    if (targetId) loadAll();
  }, [targetId, loadAll]);

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    setBusy(true);
    try {
      await api.post('/candidate/skill-claims', {
        claims: [{ skillName: skillInput.trim(), claimText: claimNote.trim() || null, source: 'manual' }],
      });
      setSkillInput('');
      setClaimNote('');
      toast.success('Skill claim saved — confirm it below to update your proof level.');
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add skill claim');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async (claimId: string) => {
    setBusy(true);
    try {
      await api.patch(`/candidate/skill-claims/${claimId}/confirm`);
      toast.success('Skill claim confirmed and proof level recalculated');
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to confirm claim');
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async (claimId: string) => {
    setBusy(true);
    try {
      await api.delete(`/candidate/skill-claims/${claimId}`);
      toast.success('Skill claim withdrawn');
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to withdraw claim');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} style={{ color: '#0f766e' }} />
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
            Confirm Your Skill Claims &amp; Live Proof Status
          </h2>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
          Add and confirm skills matching this vacancy&apos;s approved checklist. Only confirmed claims count toward your shortlist proof matrix.
        </p>
      </div>

      <form onSubmit={handleAddClaim} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          list={`skill-suggestions-${targetId}`}
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          placeholder="Select or type skill (e.g. Node.js & Express Ecosystem)..."
          className="form-input"
          style={{ flex: 1, minWidth: 220, height: 38 }}
        />
        <datalist id={`skill-suggestions-${targetId}`}>
          {suggestedSkills.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <input
          type="text"
          value={claimNote}
          onChange={(e) => setClaimNote(e.target.value)}
          placeholder="Brief experience context (optional)..."
          className="form-input"
          style={{ flex: 1, minWidth: 200, height: 38 }}
        />
        <button type="submit" disabled={busy || !skillInput.trim()} className="btn btn-gold btn-sm" style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Plus size={14} /> Add Skill Claim
        </button>
      </form>

      {/* Active Claims */}
      {!loading && claims.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {claims.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                border: `1px solid ${c.confirmed_by_candidate ? '#99f6e4' : '#fde68a'}`,
                background: c.confirmed_by_candidate ? '#f0fdfa' : '#fffbeb',
                fontSize: 12.5,
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.skill_name}</span>
              {!c.confirmed_by_candidate ? (
                <button
                  type="button"
                  onClick={() => handleConfirm(c.id)}
                  disabled={busy}
                  style={{ padding: '2px 8px', borderRadius: 5, background: '#854d0e', color: '#ffffff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm
                </button>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#0f766e' }}>
                  <CheckCircle2 size={12} /> Confirmed
                </span>
              )}
              <button
                type="button"
                onClick={() => handleWithdraw(c.id)}
                disabled={busy}
                title="Withdraw claim"
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Computed Proof Levels */}
      {!loading && proofSkills.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {proofSkills.map((p) => {
            const lb = LEVEL_BADGE[p.proofLevel] || LEVEL_BADGE.not_assessed;
            return (
              <div key={p.requirementId} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{p.skillName}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: lb.bg, color: lb.color }}>
                    {lb.label}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{p.reason}</div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && claims.length === 0 && proofSkills.length === 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> Add your first skill claim above to compute your vacancy proof matrix.
        </div>
      )}
    </div>
  );
}
