'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  User, Briefcase, Shield, FileCheck, Mic2, AlertTriangle,
  CheckCircle2, XCircle, Clock, Save, ChevronRight
} from 'lucide-react';
import { EvidenceService, DataService, CoverageMatrix, CoverageSnapshot } from '@/lib/dataService';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const DECISION_OPTIONS = [
  { value: 'Selected', label: 'Select Candidate', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { value: 'Rejected', label: 'Do Not Proceed', color: '#ba1a1a', bg: '#fef2f2', border: '#fecaca' },
  { value: 'On Hold', label: 'Place On Hold', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { value: 'Deferred', label: 'Defer Decision', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
];

export default function RecruiterReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appId = searchParams.get('appId') || '';

  const [appData, setAppData] = useState<any>(null);
  const [matrix, setMatrix] = useState<CoverageMatrix[]>([]);
  const [coverage, setCoverage] = useState<CoverageSnapshot | null>(null);
  const [integritySignals, setIntegritySignals] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [existingDecision, setExistingDecision] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review form
  const [summary, setSummary] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [gapNote, setGapNote] = useState('');
  const [integrityNote, setIntegrityNote] = useState('');
  const [interviewNote, setInterviewNote] = useState('');
  const [overallNote, setOverallNote] = useState('');

  // Decision form
  const [selectedDecision, setSelectedDecision] = useState('');
  const [rationale, setRationale] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!appId) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const [detailRes, covRes, decRes, reviewsRes] = await Promise.all([
          api.get(`/candidates/${appId}`).catch(() => null),
          EvidenceService.getCoverageMatrix(appId),
          EvidenceService.getDecision(appId),
          EvidenceService.getRecruiterReviews(appId),
        ]);
        if (detailRes?.data) {
          setAppData(detailRes.data.application);
          setIntegritySignals(detailRes.data.integritySignals || []);
          setInterviews(detailRes.data.interviews || []);
        }
        setMatrix(covRes.matrix);
        setCoverage(covRes.coverage);
        setExistingDecision(decRes);
        if (reviewsRes.length > 0) {
          const r = reviewsRes[0];
          setSummary(r.summary || '');
          setEvidenceNote(r.evidence_note || '');
          setGapNote(r.gap_note || '');
          setIntegrityNote(r.integrity_note || '');
          setInterviewNote(r.interview_note || '');
          setOverallNote(r.overall_note || '');
        }
      } finally { setLoading(false); }
    };
    load();
  }, [appId]);

  const saveReview = async () => {
    await EvidenceService.saveRecruiterReview(appId, {
      summary, evidence_note: evidenceNote, gap_note: gapNote,
      integrity_note: integrityNote, interview_note: interviewNote, overall_note: overallNote,
    });
    toast.success('Review saved');
  };

  const recordDecision = async () => {
    if (!selectedDecision) { toast.error('Select a decision'); return; }
    if (!rationale.trim()) { toast.error('Rationale is required before recording a human decision'); return; }
    setSubmitting(true);
    try {
      await EvidenceService.recordDecision(appId, {
        decision: selectedDecision,
        rationale,
        evidence_summary: `Coverage: ${coverage?.coverage_pct?.toFixed(0) || 0}% | Gaps: ${coverage?.gap_count || 0} | Signals: ${integritySignals.length}`,
      });
      toast.success(`Decision recorded: ${selectedDecision}`);
      const d = await EvidenceService.getDecision(appId);
      setExistingDecision(d);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to record decision');
    } finally { setSubmitting(false); }
  };

  const supportingCount = matrix.filter(r => r.coverage_status === 'Supporting').length;
  const gapCount = matrix.filter(r => r.coverage_status === 'Gap' || r.coverage_status === 'Evidence Gap').length;
  const openSignals = integritySignals.filter(s => s.status === 'New' || s.status === 'Under Review').length;

  if (!appId) return (
    <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
      No application selected. Go to <a href="/dashboard/candidates" style={{ color: 'var(--brand)' }}>Candidates</a> and open a candidate.
    </div>
  );

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading recruiter review…</div>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1060, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
          <span>Candidates</span> <ChevronRight size={12} /> <span>Recruiter Review</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f1623', margin: 0 }}>
              {appData ? `${appData.first_name} ${appData.last_name}` : 'Recruiter Review'}
            </h1>
            {appData && (
              <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0' }}>
                {appData.vacancy_title} · Stage: {appData.status}
              </p>
            )}
          </div>
          {existingDecision && (
            <div style={{
              padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 14,
              background: existingDecision.decision === 'Selected' ? '#ecfdf5' : existingDecision.decision === 'Rejected' ? '#fef2f2' : '#fffbeb',
              color: existingDecision.decision === 'Selected' ? '#059669' : existingDecision.decision === 'Rejected' ? '#ba1a1a' : '#d97706',
              border: `1px solid ${existingDecision.decision === 'Selected' ? '#a7f3d0' : existingDecision.decision === 'Rejected' ? '#fecaca' : '#fde68a'}`,
            }}>
              Decision Recorded: {existingDecision.decision}
            </div>
          )}
        </div>
      </div>

      {/* Evidence summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: FileCheck, label: 'Supporting Evidence', value: supportingCount, color: '#059669', bg: '#ecfdf5' },
          { icon: XCircle, label: 'Evidence Gaps', value: gapCount, color: '#ba1a1a', bg: '#fef2f2' },
          { icon: AlertTriangle, label: 'Open Integrity Signals', value: openSignals, color: '#d97706', bg: '#fffbeb' },
          { icon: Mic2, label: 'Interviews', value: interviews.length, color: '#6366f1', bg: '#eef2ff' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: s.bg, border: `1px solid ${s.color}22`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <s.icon size={18} color={s.color} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Left: Review notes */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Recruiter Review Notes</h2>
            <p style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 16 }}>
              AI may summarise evidence but must NOT output "Best Candidate", "Hire", or a suitability score. The final decision is yours.
            </p>
            {[
              { label: 'Candidate Summary', value: summary, set: setSummary, ph: 'Brief summary of this candidate…' },
              { label: 'Evidence Note', value: evidenceNote, set: setEvidenceNote, ph: 'Observations on supporting evidence…' },
              { label: 'Evidence Gap Note', value: gapNote, set: setGapNote, ph: 'Notes on any evidence gaps or missing coverage…' },
              { label: 'Integrity Signal Note', value: integrityNote, set: setIntegrityNote, ph: 'Observations on any integrity signals…' },
              { label: 'Interview Note', value: interviewNote, set: setInterviewNote, ph: 'Interview observations…' },
              { label: 'Overall Recruiter Note', value: overallNote, set: setOverallNote, ph: 'Overall assessment context note…' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5, textTransform: 'uppercase' }}>
                  {f.label}
                </label>
                <textarea value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} rows={2}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155', resize: 'vertical', fontFamily: 'inherit', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <button onClick={saveReview}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: '#f1f5f9', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Save size={13} /> Save Review
            </button>
          </div>

          {/* Evidence matrix mini-view */}
          {matrix.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Evidence Coverage</h2>
                <a href={`/dashboard/evidence/coverage?appId=${appId}`} style={{ fontSize: 12.5, color: 'var(--brand)', textDecoration: 'none' }}>View Full Matrix →</a>
              </div>
              {matrix.slice(0, 6).map((row, i) => {
                const colorMap: Record<string, string> = { Supporting: '#059669', Pending: '#d97706', Limited: '#b45309', Gap: '#ba1a1a', 'Evidence Gap': '#ba1a1a', 'Not Applicable': '#94a3b8' };
                const c = colorMap[row.coverage_status] || '#94a3b8';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 5 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#334155' }}>{row.requirement.name}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: c }}>{row.coverage_status}</span>
                  </div>
                );
              })}
              {matrix.length > 6 && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>+{matrix.length - 6} more requirements</div>}
            </div>
          )}
        </div>

        {/* Right: Human decision panel */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', position: 'sticky', top: 80 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Human Decision</h2>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
            The final decision must always be human-led. This action is audited and immutable.
          </p>

          {existingDecision ? (
            <div>
              <div style={{ padding: 14, borderRadius: 8, background: '#f0fdf4', border: '1px solid #a7f3d0', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Decision by {existingDecision.first_name} {existingDecision.last_name}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>{existingDecision.decision}</div>
                {existingDecision.rationale && <div style={{ fontSize: 12.5, color: '#334155', marginTop: 6 }}>{existingDecision.rationale}</div>}
              </div>
              <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Recorded {new Date(existingDecision.decided_at).toLocaleString()}</div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 12 }}>
                {DECISION_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setSelectedDecision(opt.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px',
                      borderRadius: 7, border: `2px solid ${selectedDecision === opt.value ? opt.color : '#e2e8f0'}`,
                      background: selectedDecision === opt.value ? opt.bg : '#fff',
                      color: selectedDecision === opt.value ? opt.color : '#64748b',
                      fontSize: 13, fontWeight: selectedDecision === opt.value ? 700 : 500,
                      cursor: 'pointer', marginBottom: 6, textAlign: 'left',
                    }}>
                    {selectedDecision === opt.value
                      ? <CheckCircle2 size={14} color={opt.color} />
                      : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #e2e8f0' }} />}
                    {opt.label}
                  </button>
                ))}
              </div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5, textTransform: 'uppercase' }}>
                Decision Rationale *
              </label>
              <textarea value={rationale} onChange={e => setRationale(e.target.value)} rows={4}
                placeholder="Provide the human rationale for this decision. This will be recorded in the audit trail."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155', resize: 'vertical', fontFamily: 'inherit', background: '#f8fafc', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
              />
              <button onClick={recordDecision} disabled={submitting || !selectedDecision || !rationale.trim()}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                  background: selectedDecision ? (DECISION_OPTIONS.find(o => o.value === selectedDecision)?.color || 'var(--brand)') : '#e2e8f0',
                  color: '#fff', fontSize: 14, fontWeight: 700, cursor: !selectedDecision || !rationale.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}>
                {submitting ? 'Recording…' : 'Record Human Decision'}
              </button>
              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                This action is immutable and creates an audit trail entry.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
