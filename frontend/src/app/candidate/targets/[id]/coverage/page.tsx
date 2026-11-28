'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  FileCheck,
  Plus,
  Info,
  Layers,
} from 'lucide-react';
import api from '@/lib/api';
import { SkillProofBadge, SkillProofItem } from '@/components/features/SkillProofBadge';
import { findSkillProofForRequirement, getProofNextAction } from '@/lib/skillProof';
import toast from 'react-hot-toast';

export default function TargetCoveragePage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any>(null);
  const [skillProofs, setSkillProofs] = useState<SkillProofItem[]>([]);
  const [claimingSkill, setClaimingSkill] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCoverage = () => {
    setLoading(true);
    Promise.all([
      api.get(`/candidate-portal/targets/${targetId}`),
      api.get(`/candidate-portal/targets/${targetId}/evidence`).catch(() => ({ data: { evidence: [] } })),
      api.get(`/candidate-portal/targets/${targetId}/coverage`).catch(() => ({ data: { coverage: null } })),
      api.get(`/candidate/skill-claims/targets/${targetId}/proof`).catch(() => ({ data: { skills: [] } })),
    ])
      .then(([targetRes, evRes, covRes, proofRes]) => {
        setTarget(targetRes.data?.target);
        setRequirements(targetRes.data?.requirements || []);
        setEvidenceList(evRes.data?.evidence || []);
        setCoverage(covRes.data?.coverage || targetRes.data?.coverage);
        setSkillProofs(proofRes.data?.skills || []);
      })
      .catch((err) => {
        console.error('Failed to load coverage:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCoverage();
  }, [targetId]);

  const handleConfirmSkillClaim = async (skillName: string) => {
    setClaimingSkill(skillName);
    try {
      const createRes = await api.post('/candidate/skill-claims', {
        claims: [{ skillName, source: 'manual' }],
      });
      const claimId = createRes.data?.claims?.[0]?.id;
      if (claimId) {
        await api.patch(`/candidate/skill-claims/${claimId}/confirm`);
      }
      toast.success(`Confirmed skill claim for ${skillName}`);
      loadCoverage();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not confirm skill claim');
    } finally {
      setClaimingSkill(null);
    }
  };

  const getProofForReq = (req: any): SkillProofItem | undefined => findSkillProofForRequirement(skillProofs, req);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Computing Requirement Coverage...</div>
        </div>
      </div>
    );
  }

  const requiredReqs = requirements.filter((r) => (r.importance || 'REQUIRED').toUpperCase() === 'REQUIRED');
  const preferredReqs = requirements.filter((r) => (r.importance || '').toUpperCase() === 'PREFERRED');

  const getReqState = (reqId: string) => {
    const ev = evidenceList.filter((e) => e.requirement_id === reqId);
    if (ev.some((e) => e.review_status === 'ACCEPTED')) return 'SUPPORTED';
    if (ev.some((e) => e.review_status === 'LIMITED')) return 'LIMITED';
    if (ev.some((e) => e.review_status === 'SUBMITTED' || e.review_status === 'UNDER_REVIEW')) return 'PENDING';
    return 'EVIDENCE_GAP';
  };

  const requiredSupported = requiredReqs.filter((r) => getReqState(r.id) === 'SUPPORTED').length;
  const preferredSupported = preferredReqs.filter((r) => getReqState(r.id) === 'SUPPORTED').length;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: 'rgba(6, 95, 70, 0.2)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6ee7b7',
                  textTransform: 'uppercase',
                }}
              >
                {target?.company_name} · Coverage & Gaps
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
              Requirement Coverage & Gaps
            </h1>
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 650 }}>
              Transparent requirement-by-requirement coverage ledger. We present exact evidence status instead of a pseudo-scientific AI score.
            </p>
          </div>

          {/* Transparent Counters */}
          <div
            className="mobile-full"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              padding: '16px 20px',
              minWidth: 'min(100%, 240px)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
              Coverage Summary
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
              Required requirements: <span style={{ color: '#fef08a' }}>{requiredSupported} of {requiredReqs.length} supported</span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#e2e8f0' }}>
              Preferred requirements: <span style={{ color: '#fef08a' }}>{preferredSupported} of {preferredReqs.length || 0} supported</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Evidence Gap Notice */}
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
          <strong>Evidence Gap Clarification:</strong> An <em>Evidence Gap</em> does not mean you lack the skill. It means sufficient supporting evidence is not currently available for this requirement.
        </span>
      </div>

      {/* Coverage Matrix Table */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Requirement Coverage Ledger
        </h2>

        <div className="table-responsive desktop-table-only">
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Importance</th>
                <th>Proof Level (Claimed vs Verified)</th>
                <th>Submitted Evidence</th>
                <th style={{ textAlign: 'right' }}>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req) => {
                const reqEvidence = evidenceList.filter((e) => e.requirement_id === req.id);
                const state = getReqState(req.id);
                const proof = getProofForReq(req);
                const isRequired = (req.importance || 'REQUIRED').toUpperCase() === 'REQUIRED';

                return (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
                        {req.name}
                      </div>
                      {req.description && (
                        <div style={{ fontSize: 11.5, color: '#64748b', maxWidth: 400 }}>{req.description}</div>
                      )}
                      <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>{proof?.reason || getProofNextAction(proof)}</div>
                    </td>
                    <td>
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
                    </td>
                    <td>
                      <SkillProofBadge item={proof || { skillName: req.name, proofLevel: state === 'SUPPORTED' ? 'verified' : 'not_assessed', status: state === 'SUPPORTED' ? 'meets' : 'missing' }} />
                    </td>
                    <td>
                      {reqEvidence.length > 0 ? (
                        <div style={{ fontSize: 12, color: '#334155' }}>
                          <span style={{ fontWeight: 700 }}>{reqEvidence.length} item(s): </span>
                          <span>{reqEvidence.map((e) => e.title).join(', ')}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>None submitted</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {(!proof || proof.proofLevel === 'not_assessed') && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={claimingSkill === req.name}
                            onClick={() => handleConfirmSkillClaim(req.name)}
                            style={{ fontSize: 11.5, padding: '4px 10px' }}
                          >
                            {claimingSkill === req.name ? 'Saving...' : 'Confirm Claim'}
                          </button>
                        )}
                        <Link
                          href={`/candidate/targets/${targetId}/evidence`}
                          className="btn btn-secondary"
                          style={{ fontSize: 11.5, padding: '4px 10px', textDecoration: 'none' }}
                        >
                          {state === 'EVIDENCE_GAP' ? '+ Submit Evidence' : 'View in Locker'}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (< 768px) */}
        <div className="mobile-cards-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requirements.map((req) => {
            const reqEvidence = evidenceList.filter((e) => e.requirement_id === req.id);
            const state = getReqState(req.id);
            const proof = getProofForReq(req);
            const isRequired = (req.importance || 'REQUIRED').toUpperCase() === 'REQUIRED';
            return (
              <div key={req.id} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: '#fafaf9', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{req.name}</div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: isRequired ? '#fee2e2' : '#fef3c7', color: isRequired ? '#991b1b' : '#92400e' }}>
                    {req.importance || 'REQUIRED'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>{proof?.reason || getProofNextAction(proof)}</div>
                <div style={{ fontSize: 12, color: '#334155' }}>
                  <strong>Evidence: </strong>
                  {reqEvidence.length > 0 ? `${reqEvidence.length} item(s): ${reqEvidence.map((e) => e.title).join(', ')}` : 'None submitted'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 6 }}>
                  <SkillProofBadge item={proof || { skillName: req.name, proofLevel: state === 'SUPPORTED' ? 'verified' : 'not_assessed', status: state === 'SUPPORTED' ? 'meets' : 'missing' }} />
                  {(!proof || proof.proofLevel === 'not_assessed') && (
                    <button type="button" className="btn btn-secondary btn-mobile-full" disabled={claimingSkill === req.name} onClick={() => handleConfirmSkillClaim(req.name)} style={{ fontSize: 12 }}>
                      {claimingSkill === req.name ? 'Saving...' : 'Confirm Claim'}
                    </button>
                  )}
                  <Link href={`/candidate/targets/${targetId}/evidence`} className="btn btn-secondary btn-mobile-full" style={{ fontSize: 12, textDecoration: 'none' }}>
                    {state === 'EVIDENCE_GAP' ? '+ Submit Evidence' : 'View in Locker'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
